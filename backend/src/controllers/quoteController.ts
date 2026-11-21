import { Response } from "express";
import prisma from "../prisma";
import { syncQuoteJob } from "../services/quoteJobs";
import { AuthRequest } from "../middleware/auth";
import { parsePagination } from "../utils/pagination";
import { customerWhere } from "../utils/customerFilter";

export async function getQuoteRecords(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { page, size } = parsePagination(req.query, 20);
  const companyId = req.user!.companyId!;
  const where = { companyId, ...customerWhere(req.query) };

  const [content, totalElements] = await Promise.all([
    prisma.quoteRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page * size,
      take: size,
    }),
    prisma.quoteRecord.count({ where }),
  ]);

  res.json({
    content,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    number: page,
    size,
  });
}

export async function createQuoteRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const {
    title, documentDate, customerName, customerId, contactPerson, email, phone, fax, website, subscriberNo, address,
    notes, lines, validUntil, tryRates,
  } = req.body;
  const companyId = req.user!.companyId!;

  if (!customerName?.trim()) {
    res.status(400).json({ message: "Müşteri adı zorunludur." });
    return;
  }

  const record = await prisma.quoteRecord.create({
    data: {
      title: title || null,
      documentDate: documentDate || new Date().toLocaleDateString("tr-TR"),
      customerName: customerName.trim(),
      customerId: customerId || null,
      contactPerson: contactPerson || null,
      email: email || null,
      phone: phone || null,
      fax: fax || null,
      website: website || null,
      subscriberNo: subscriberNo || null,
      address: address || null,
      notes: notes || null,
      lines: JSON.stringify(lines || []),
      validUntil: validUntil || null,
      tryRates: tryRates ?? null,
      companyId,
    },
  });

  res.status(201).json(record);
}

export async function updateQuoteRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;
  const {
    title, documentDate, customerName, customerId, contactPerson, email, phone, fax, website, subscriberNo, address,
    notes, lines, validUntil, tryRates,
  } = req.body;

  const existing = await prisma.quoteRecord.findFirst({
    where: { id, companyId },
  });

  if (!existing) {
    res.status(404).json({ message: "Teklif kaydı bulunamadı." });
    return;
  }

  const record = await prisma.quoteRecord.update({
    where: { id },
    data: {
      title: title ?? existing.title,
      documentDate: documentDate ?? existing.documentDate,
      customerName: customerName?.trim() ?? existing.customerName,
      customerId: customerId ?? existing.customerId,
      contactPerson: contactPerson ?? existing.contactPerson,
      email: email ?? existing.email,
      phone: phone ?? existing.phone,
      fax: fax ?? existing.fax,
      website: website ?? existing.website,
      subscriberNo: subscriberNo ?? existing.subscriberNo,
      address: address ?? existing.address,
      notes: notes ?? existing.notes,
      lines: lines ? JSON.stringify(lines) : existing.lines,
      validUntil: validUntil ?? existing.validUntil,
      tryRates: tryRates ?? existing.tryRates,
    },
  });

  res.json(record);
}

export async function deleteQuoteRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;

  const existing = await prisma.quoteRecord.findFirst({
    where: { id, companyId },
  });

  if (!existing) {
    res.status(404).json({ message: "Teklif kaydı bulunamadı." });
    return;
  }

  // Teklif silinince henuz atanmamis isi de iptal edilir; planlanmis/tamamlanmis is kalir.
  await prisma.$transaction([
    prisma.appointment.updateMany({ where: { quoteId: id, companyId, status: "AWAITING" }, data: { status: "CANCELLED" } }),
    prisma.quoteRecord.delete({ where: { id } }),
  ]);
  res.json({ message: "Teklif kaydı silindi." });
}

/** Teklif durumunu degistirir (Bekliyor / Kabul / Red). */
export async function updateQuoteStatus(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;
  const { status } = req.body as { status: string };

  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "Geçersiz teklif." });
    return;
  }

  // Durum degisikligi ve planlama isi ayni islemde: biri basarisiz olursa ikisi de geri alinir.
  const result = await prisma.$transaction(async (tx) => {
    const { count } = await tx.quoteRecord.updateMany({
      where: { id, companyId },
      data: { status, statusUpdatedAt: new Date() },
    });
    if (count === 0) return null;
    const sync = await syncQuoteJob(tx, companyId, id, status);
    const record = await tx.quoteRecord.findFirst({ where: { id, companyId } });
    return { record, sync };
  });

  if (!result) {
    res.status(404).json({ message: "Teklif kaydı bulunamadı." });
    return;
  }

  res.json({ ...result.record, job: result.sync.job, jobWarning: result.sync.warning });
}

/** Tek teklif (servis formuna teklif kalemlerini aktarmak icin). */
export async function getQuoteRecord(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;
  const record = await prisma.quoteRecord.findFirst({ where: { id, companyId } });
  if (!record) {
    res.status(404).json({ message: "Teklif kaydı bulunamadı." });
    return;
  }
  const job = await prisma.appointment.findFirst({
    where: { quoteId: id, companyId },
    select: { id: true, status: true, serviceRecordId: true },
  });
  res.json({ ...record, job });
}

/**
 * Musteri kaydi olmayan teklifin musterisini kaydeder (kabul / servis formu oncesi).
 * Ayni isimde musteri varsa yenisi acilmaz, ona baglanir. Teklif ve teklife bagli
 * planlama isi bu musteriye baglanir.
 */
export async function saveQuoteCustomer(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;
  const quote = await prisma.quoteRecord.findFirst({ where: { id, companyId } });
  if (!quote) {
    res.status(404).json({ message: "Teklif kaydı bulunamadı." });
    return;
  }
  const name = quote.customerName.trim();
  if (!name) {
    res.status(400).json({ message: "Teklifte müşteri adı yok." });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const linked = quote.customerId
      ? await tx.customer.findFirst({ where: { id: quote.customerId, companyId } })
      : null;
    if (linked) return { customer: linked, created: false };
    const existing = await tx.customer.findFirst({
      where: { companyId, companyName: { equals: name, mode: "insensitive" } },
    });
    const opt = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
    const customer = existing ?? await tx.customer.create({
      data: {
        companyId,
        companyName: name,
        contactPerson: opt(quote.contactPerson),
        phone: opt(quote.phone),
        email: opt(quote.email),
        address: opt(quote.address),
        fax: opt(quote.fax),
        website: opt(quote.website),
        subscriberNo: opt(quote.subscriberNo),
      },
    });
    await tx.quoteRecord.update({ where: { id: quote.id }, data: { customerId: customer.id } });
    await tx.appointment.updateMany({ where: { quoteId: quote.id, companyId }, data: { customerId: customer.id } });
    return { customer, created: !existing };
  });

  res.status(result.created ? 201 : 200).json(result);
}

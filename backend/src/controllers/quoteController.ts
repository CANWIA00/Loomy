import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export async function getQuoteRecords(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 20;
    const companyId = req.user!.companyId!;

    const [content, totalElements] = await Promise.all([
      prisma.quoteRecord.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        skip: page * size,
        take: size,
      }),
      prisma.quoteRecord.count({ where: { companyId } }),
    ]);

    res.json({
      content,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      number: page,
      size,
    });
  } catch (error: any) {
    console.error("GetQuoteRecords error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function createQuoteRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const {
      documentDate, customerName, customerId, contactPerson, email, phone, fax, website, subscriberNo, address,
      notes, lines, validUntil, tryRates,
    } = req.body;
    const companyId = req.user!.companyId!;

    if (!customerName?.trim()) {
      res.status(400).json({ message: "Müşteri adı zorunludur." });
      return;
    }

    const record = await prisma.quoteRecord.create({
      data: {
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
  } catch (error: any) {
    console.error("CreateQuoteRecord error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateQuoteRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const {
      documentDate, customerName, customerId, contactPerson, email, phone, fax, website, subscriberNo, address,
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
  } catch (error: any) {
    console.error("UpdateQuoteRecord error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function deleteQuoteRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;

    const existing = await prisma.quoteRecord.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      res.status(404).json({ message: "Teklif kaydı bulunamadı." });
      return;
    }

    await prisma.quoteRecord.delete({ where: { id } });
    res.json({ message: "Teklif kaydı silindi." });
  } catch (error: any) {
    console.error("DeleteQuoteRecord error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

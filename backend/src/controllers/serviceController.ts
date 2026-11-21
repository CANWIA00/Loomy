import { Response } from "express";
import prisma from "../prisma";
import { completeQuoteJob } from "../services/quoteJobs";
import { AuthRequest } from "../middleware/auth";
import { scheduleRecomputeForRecord, periodKey, scheduleRecomputeMonth } from "../services/monthlySummaries";
import { applyUsedProductsTx, parseUsedProducts, reverseUsedProductsTx } from "../services/serviceUsedProducts";
import { resolveProductsModeTotal } from "../utils/serviceTotals";
import { parsePagination } from "../utils/pagination";
import { customerWhere } from "../utils/customerFilter";

export async function getServiceRecords(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { page, size } = parsePagination(req.query, 20);
  const companyId = req.user!.companyId!;
  const where = { companyId, ...customerWhere(req.query) };

  const [content, totalElements] = await Promise.all([
    prisma.serviceRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page * size,
      take: size,
    }),
    prisma.serviceRecord.count({ where }),
  ]);

  res.json({
    content,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    number: page,
    size,
  });
}

export async function createServiceRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const {
    documentDate, customerName, customerId, serviceType, address,
    startTime, endTime, phone, internalIp, externalIp, details,
    fee, feeCurrency, labor, laborCurrency, kdvRate, technician, technicianPhone, services, technical, customChips, customValues, signed, signature, technicianSignature, paid,
    templateName, templateConfig, usedProducts, productsMode, deductStock, tryRates, appointmentId, quoteId,
  } = req.body;
  const companyId = req.user!.companyId!;

  if (!customerName?.trim()) {
    res.status(400).json({ message: "Müşteri adı zorunludur." });
    return;
  }

  let record = null as Awaited<ReturnType<typeof prisma.serviceRecord.create>> | null;
  await prisma.$transaction(async (tx) => {
    record = await tx.serviceRecord.create({
      data: {
        documentDate: documentDate || new Date().toLocaleDateString("tr-TR"),
        customerName: customerName.trim(),
        customerId: customerId || null,
        serviceType: serviceType || "",
        address: address || null,
        startTime: startTime || null,
        endTime: endTime || null,
        phone: phone || null,
        internalIp: internalIp || null,
        externalIp: externalIp || null,
        details: details || null,
        fee: fee || "0.00",
        feeCurrency: feeCurrency || "TRY",
        labor: labor || "0.00",
        laborCurrency: laborCurrency || "TRY",
        kdvRate: kdvRate || "20",
        technician: technician || null,
        technicianPhone: technicianPhone || null,
        services: JSON.stringify(services || []),
        technical: JSON.stringify(technical || []),
        customChips: customChips ? JSON.stringify(customChips) : null,
        customValues: customValues ? JSON.stringify(customValues) : null,
        signed: signed || false,
        paid: paid || false,
        signature: signature || null,
        technicianSignature: technicianSignature || null,
        usedProducts: "[]",
        productsMode: !!productsMode,
        templateName: templateName || null,
        templateConfig: templateConfig ? JSON.stringify(templateConfig) : null,
        companyId,
      },
    });

    const resolved = await applyUsedProductsTx(tx, companyId, record.id, null, usedProducts, deductStock !== undefined ? !!deductStock : true);
    const patch: { usedProducts?: string; fee?: string; feeCurrency?: string } = {};
    if (resolved.length) {
      patch.usedProducts = JSON.stringify(resolved);
    }
    const total = await resolveProductsModeTotal({
      productsMode: !!productsMode,
      usedProducts: resolved.length ? resolved : (Array.isArray(usedProducts) ? usedProducts : []),
      fee,
      feeCurrency,
      labor,
      laborCurrency,
      kdvRate,
    }, tryRates);
    if (total != null) {
      patch.fee = total;
      patch.feeCurrency = "TRY";
    }
    if (Object.keys(patch).length) {
      await tx.serviceRecord.update({ where: { id: record.id }, data: patch });
    }
    // Planlama isinden acildiysa is tamamlandi olarak isaretlenir ve kayda baglanir.
    const jobId = Number(appointmentId);
    const fromQuoteId = Number(quoteId);
    if (Number.isInteger(jobId) && jobId > 0) {
      await tx.appointment.updateMany({
        where: { id: jobId, companyId, status: { in: ["AWAITING", "SCHEDULED"] } },
        data: { status: "DONE", serviceRecordId: record.id },
      });
    } else if (Number.isInteger(fromQuoteId) && fromQuoteId > 0) {
      // Tekliften acildi ve teklifin acik isi yoktu: teklif kabul edilir, is tamamlanmis kaydedilir.
      await completeQuoteJob(tx, companyId, fromQuoteId, record.id);
    }
  });

  const saved = await prisma.serviceRecord.findFirst({ where: { id: record!.id, companyId } });
  await scheduleRecomputeForRecord(companyId, saved?.documentDate, saved?.createdAt);
  if (saved && parseUsedProducts(saved.usedProducts).some((p) => p.deducted)) {
    await scheduleRecomputeMonth(companyId, periodKey(new Date()));
  }

  res.status(201).json(saved);
}

export async function updateServiceRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;
  const {
    documentDate, customerName, customerId, serviceType, address,
    startTime, endTime, phone, internalIp, externalIp, details,
    fee, feeCurrency, labor, laborCurrency, kdvRate, technician, technicianPhone, services, technical, customChips, customValues, signed, signature, technicianSignature, paid,
    templateName, templateConfig, usedProducts, productsMode, deductStock, tryRates,
  } = req.body;

  const existing = await prisma.serviceRecord.findFirst({
    where: { id, companyId },
  });

  if (!existing) {
    res.status(404).json({ message: "Servis kaydı bulunamadı." });
    return;
  }

  const hasUsedProducts = Array.isArray(usedProducts);
  const effectiveProductsMode = productsMode !== undefined ? !!productsMode : existing.productsMode;

  await prisma.$transaction(async (tx) => {
    await tx.serviceRecord.update({
      where: { id },
      data: {
        documentDate: documentDate ?? existing.documentDate,
        customerName: customerName?.trim() ?? existing.customerName,
        customerId: customerId ?? existing.customerId,
        serviceType: serviceType ?? existing.serviceType,
        address: address ?? existing.address,
        startTime: startTime ?? existing.startTime,
        endTime: endTime ?? existing.endTime,
        phone: phone ?? existing.phone,
        internalIp: internalIp ?? existing.internalIp,
        externalIp: externalIp ?? existing.externalIp,
        details: details ?? existing.details,
        fee: fee ?? existing.fee,
        feeCurrency: feeCurrency ?? existing.feeCurrency,
        labor: labor ?? existing.labor,
        laborCurrency: laborCurrency ?? existing.laborCurrency,
        kdvRate: kdvRate ?? existing.kdvRate,
        technician: technician ?? existing.technician,
        technicianPhone: technicianPhone ?? existing.technicianPhone,
        services: services ? JSON.stringify(services) : existing.services,
        technical: technical ? JSON.stringify(technical) : existing.technical,
        customChips: customChips ? JSON.stringify(customChips) : existing.customChips,
        customValues: customValues ? JSON.stringify(customValues) : existing.customValues,
        signed: signed ?? existing.signed,
        paid: paid ?? existing.paid,
        signature: signature ?? existing.signature,
        technicianSignature: technicianSignature ?? existing.technicianSignature,
        templateName: templateName ?? existing.templateName,
        templateConfig: templateConfig ? JSON.stringify(templateConfig) : existing.templateConfig,
        productsMode: productsMode !== undefined ? !!productsMode : existing.productsMode,
      },
    });

    let effectiveProducts = parseUsedProducts(existing.usedProducts);
    const patch: { usedProducts?: string; fee?: string; feeCurrency?: string } = {};

    if (hasUsedProducts) {
      const resolved = await applyUsedProductsTx(
        tx,
        companyId,
        id,
        existing.usedProducts,
        usedProducts,
        deductStock !== undefined ? !!deductStock : true
      );
      effectiveProducts = resolved;
      patch.usedProducts = JSON.stringify(resolved);
    }

    if (effectiveProductsMode) {
      const total = await resolveProductsModeTotal({
        productsMode: true,
        usedProducts: effectiveProducts,
        fee: fee ?? existing.fee,
        feeCurrency: feeCurrency ?? existing.feeCurrency,
        labor: labor ?? existing.labor,
        laborCurrency: laborCurrency ?? existing.laborCurrency,
        kdvRate: kdvRate ?? existing.kdvRate,
      }, tryRates);
      if (total != null) {
        patch.fee = total;
        patch.feeCurrency = "TRY";
      }
    }

    if (Object.keys(patch).length) {
      await tx.serviceRecord.update({ where: { id }, data: patch });
    }
  });

  const saved = await prisma.serviceRecord.findFirst({ where: { id, companyId } });
  await scheduleRecomputeForRecord(companyId, existing.documentDate, existing.createdAt as any);
  await scheduleRecomputeForRecord(companyId, (saved as any)?.documentDate, (saved as any)?.createdAt);
  if (hasUsedProducts) {
    await scheduleRecomputeMonth(companyId, periodKey(new Date()));
  }

  res.json(saved);
}

export async function countServiceRecordsByTemplate(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { name } = req.body;
  const companyId = req.user!.companyId!;
  const count = name
    ? await prisma.serviceRecord.count({ where: { companyId, templateName: name } })
    : 0;
  res.json({ count });
}

export async function applyTemplateConfigToRecords(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { oldName, newName, templateConfig } = req.body;
  const companyId = req.user!.companyId!;

  if (!oldName || !newName) {
    res.status(400).json({ message: "Şablon adı zorunludur." });
    return;
  }

  const names = Array.from(new Set([oldName, newName].filter(Boolean)));
  const result = await prisma.serviceRecord.updateMany({
    where: { companyId, templateName: { in: names } },
    data: {
      templateName: newName,
      ...(templateConfig ? { templateConfig: JSON.stringify(templateConfig) } : {}),
      ...(templateConfig && templateConfig.useProducts != null ? { productsMode: !!templateConfig.useProducts } : {}),
    },
  });

  res.json({ updated: result.count });
}

export async function deleteServiceRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;

  const existing = await prisma.serviceRecord.findFirst({
    where: { id, companyId },
  });

  if (!existing) {
    res.status(404).json({ message: "Servis kaydı bulunamadı." });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await reverseUsedProductsTx(tx, companyId, existing.usedProducts);
    await tx.serviceRecord.delete({ where: { id } });
  });
  await scheduleRecomputeForRecord(companyId, existing.documentDate, existing.createdAt as any);
  await scheduleRecomputeMonth(companyId, periodKey(new Date()));
  res.json({ message: "Servis kaydı silindi." });
}

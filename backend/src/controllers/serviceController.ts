import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export async function getServiceRecords(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 20;
    const companyId = req.user!.companyId!;

    const [content, totalElements] = await Promise.all([
      prisma.serviceRecord.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        skip: page * size,
        take: size,
      }),
      prisma.serviceRecord.count({ where: { companyId } }),
    ]);

    res.json({
      content,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      number: page,
      size,
    });
  } catch (error: any) {
    console.error("GetServiceRecords error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function createServiceRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const {
      documentDate, customerName, customerId, serviceType, address,
      startTime, endTime, phone, internalIp, externalIp, details,
      fee, technician, services, technical, customChips, customValues, signed, signature, technicianSignature, paid,
      templateName, templateConfig,
    } = req.body;
    const companyId = req.user!.companyId!;

    if (!customerName?.trim()) {
      res.status(400).json({ message: "Müşteri adı zorunludur." });
      return;
    }

    const record = await prisma.serviceRecord.create({
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
        technician: technician || null,
        services: JSON.stringify(services || []),
        technical: JSON.stringify(technical || []),
        customChips: customChips ? JSON.stringify(customChips) : null,
        customValues: customValues ? JSON.stringify(customValues) : null,
        signed: signed || false,
        paid: paid || false,
        signature: signature || null,
        technicianSignature: technicianSignature || null,
        templateName: templateName || null,
        templateConfig: templateConfig ? JSON.stringify(templateConfig) : null,
        companyId,
      },
    });

    res.status(201).json(record);
  } catch (error: any) {
    console.error("CreateServiceRecord error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateServiceRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const {
      documentDate, customerName, customerId, serviceType, address,
      startTime, endTime, phone, internalIp, externalIp, details,
      fee, technician, services, technical, customChips, customValues, signed, signature, technicianSignature, paid,
      templateName, templateConfig,
    } = req.body;

    const existing = await prisma.serviceRecord.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      res.status(404).json({ message: "Servis kaydı bulunamadı." });
      return;
    }

    const record = await prisma.serviceRecord.update({
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
        technician: technician ?? existing.technician,
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
      },
    });

    res.json(record);
  } catch (error: any) {
    console.error("UpdateServiceRecord error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function countServiceRecordsByTemplate(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name } = req.body;
    const companyId = req.user!.companyId!;
    const count = name
      ? await prisma.serviceRecord.count({ where: { companyId, templateName: name } })
      : 0;
    res.json({ count });
  } catch (error: any) {
    console.error("CountServiceRecordsByTemplate error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function applyTemplateConfigToRecords(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
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
      },
    });

    res.json({ updated: result.count });
  } catch (error: any) {
    console.error("ApplyTemplateConfigToRecords error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function deleteServiceRecord(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;

    const existing = await prisma.serviceRecord.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      res.status(404).json({ message: "Servis kaydı bulunamadı." });
      return;
    }

    await prisma.serviceRecord.delete({ where: { id } });
    res.json({ message: "Servis kaydı silindi." });
  } catch (error: any) {
    console.error("DeleteServiceRecord error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

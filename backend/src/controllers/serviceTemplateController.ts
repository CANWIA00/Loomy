import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

interface FieldConfig {
  key: string;
  labelTr: string;
  labelEn: string;
  enabled: boolean;
  order: number;
}

interface ChipOptionConfig {
  key: string;
  labelTr: string;
  labelEn: string;
}

interface ChipGroupConfig {
  key: string;
  labelTr: string;
  labelEn: string;
  enabled: boolean;
  order: number;
  options: ChipOptionConfig[];
}

export interface ServiceTemplateConfig {
  fields: FieldConfig[];
  chipGroups: ChipGroupConfig[];
}

export function defaultTemplateConfig(): ServiceTemplateConfig {
  const fields: FieldConfig[] = [
    { key: "serviceAddress", labelTr: "Servis Adresi", labelEn: "Service Address", enabled: true, order: 10 },
    { key: "startTime", labelTr: "Başlangıç Saati", labelEn: "Start Time", enabled: true, order: 20 },
    { key: "endTime", labelTr: "Bitiş Saati", labelEn: "End Time", enabled: true, order: 30 },
    { key: "phone", labelTr: "Müşteri Telefonu", labelEn: "Customer Phone", enabled: true, order: 40 },
    { key: "internalIp", labelTr: "Dahili IP", labelEn: "Internal IP", enabled: true, order: 50 },
    { key: "externalIp", labelTr: "Harici IP", labelEn: "External IP", enabled: true, order: 60 },
    { key: "details", labelTr: "Detaylar", labelEn: "Details", enabled: true, order: 90 },
    { key: "fee", labelTr: "Servis Ücreti", labelEn: "Service Fee", enabled: true, order: 100 },
    { key: "documentDate", labelTr: "Belge Tarihi", labelEn: "Document Date", enabled: true, order: 110 },
  ];

  const services: ChipGroupConfig = {
    key: "services",
    labelTr: "Yapılan Servisler",
    labelEn: "Services",
    enabled: true,
    order: 70,
    options: [
      { key: "alarm", labelTr: "Alarm", labelEn: "Alarm" },
      { key: "fire", labelTr: "Yangın", labelEn: "Fire" },
      { key: "cctv", labelTr: "CCTV", labelEn: "CCTV" },
      { key: "ahm", labelTr: "AHM Bağlantısı", labelEn: "AHM Connection" },
      { key: "wiring", labelTr: "Kablolama", labelEn: "Wiring" },
      { key: "assembly", labelTr: "Montaj", labelEn: "Assembly" },
      { key: "commissioning", labelTr: "Devreye Alma Eğitimi", labelEn: "Commissioning Training" },
      { key: "docCheck", labelTr: "Belge Kontrolü", labelEn: "Document Check" },
      { key: "testing", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
      { key: "maintenance", labelTr: "Bakım", labelEn: "Maintenance" },
      { key: "repair", labelTr: "Arıza", labelEn: "Repair" },
      { key: "training", labelTr: "Devreye Alma", labelEn: "Commissioning" },
    ],
  };

  const technical: ChipGroupConfig = {
    key: "technical",
    labelTr: "Teknik Kontroller",
    labelEn: "Technical",
    enabled: true,
    order: 80,
    options: [
      { key: "ahmSignal", labelTr: "AHM Sinyal Kontrolü", labelEn: "AHM Signal Check" },
      { key: "drill", labelTr: "Eğitim ve Tatbikat", labelEn: "Training and Drill" },
      { key: "dovr", labelTr: "DOVR Kayıt Kontrol", labelEn: "DOVR Record Check" },
      { key: "remote", labelTr: "Uzak Erişim", labelEn: "Remote Access" },
      { key: "backup", labelTr: "Kayıt ve Yedekleme Eğitimi", labelEn: "Recording and Backup Training" },
      { key: "cameraClarity", labelTr: "Kameralara Netlik ve Yön Ayarı", labelEn: "Camera Clarity and Direction Adjustment" },
      { key: "signalTest", labelTr: "Test Sinyal Programlama", labelEn: "Test Signal Programming" },
      { key: "battery", labelTr: "Akü Ömrü Kontrolü", labelEn: "Battery Life Check" },
      { key: "wirelessPil", labelTr: "Kablosuz Dedektör Pil Kontrolü", labelEn: "Wireless Detector Battery Check" },
      { key: "gprs", labelTr: "GPRS Bağlantısı", labelEn: "GPRS Connection" },
    ],
  };

  return { fields, chipGroups: [services, technical] };
}

export async function listServiceTemplates(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;

    let templates = await prisma.serviceFormTemplate.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });

    if (templates.length === 0) {
      const created = await prisma.serviceFormTemplate.create({
        data: {
          companyId,
          name: "Varsayılan",
          fields: JSON.stringify(defaultTemplateConfig().fields),
          chipGroups: JSON.stringify(defaultTemplateConfig().chipGroups),
          isDefault: true,
        },
      });
      templates = [created];
    }

    res.json(
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        isDefault: t.isDefault,
        fields: JSON.parse(t.fields),
        chipGroups: JSON.parse(t.chipGroups),
      }))
    );
  } catch (error: any) {
    console.error("ListServiceTemplates error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function createServiceTemplate(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const { name, fields, chipGroups, isDefault } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ message: "Şablon adı zorunludur." });
      return;
    }

    const existing = await prisma.serviceFormTemplate.count({ where: { companyId } });

    const template = await prisma.serviceFormTemplate.create({
      data: {
        companyId,
        name: name.trim(),
        fields: JSON.stringify(fields || defaultTemplateConfig().fields),
        chipGroups: JSON.stringify(chipGroups || defaultTemplateConfig().chipGroups),
        isDefault: existing === 0 ? true : !!isDefault,
      },
    });

    if (template.isDefault) {
      await prisma.serviceFormTemplate.updateMany({
        where: { companyId, id: { not: template.id } },
        data: { isDefault: false },
      });
    }

    res.status(201).json({
      id: template.id,
      name: template.name,
      isDefault: template.isDefault,
      fields: JSON.parse(template.fields),
      chipGroups: JSON.parse(template.chipGroups),
    });
  } catch (error: any) {
    console.error("CreateServiceTemplate error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateServiceTemplate(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id);
    const companyId = req.user!.companyId!;
    const { name, fields, chipGroups, isDefault } = req.body;

    const existing = await prisma.serviceFormTemplate.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      res.status(404).json({ message: "Şablon bulunamadı." });
      return;
    }

    const template = await prisma.serviceFormTemplate.update({
      where: { id },
      data: {
        name: name?.trim() ?? existing.name,
        fields: fields ? JSON.stringify(fields) : existing.fields,
        chipGroups: chipGroups ? JSON.stringify(chipGroups) : existing.chipGroups,
        isDefault: isDefault !== undefined ? !!isDefault : existing.isDefault,
      },
    });

    if (template.isDefault) {
      await prisma.serviceFormTemplate.updateMany({
        where: { companyId, id: { not: template.id } },
        data: { isDefault: false },
      });
    }

    res.json({
      id: template.id,
      name: template.name,
      isDefault: template.isDefault,
      fields: JSON.parse(template.fields),
      chipGroups: JSON.parse(template.chipGroups),
    });
  } catch (error: any) {
    console.error("UpdateServiceTemplate error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function setDefaultServiceTemplate(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id);
    const companyId = req.user!.companyId!;

    const existing = await prisma.serviceFormTemplate.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      res.status(404).json({ message: "Şablon bulunamadı." });
      return;
    }

    await prisma.serviceFormTemplate.updateMany({
      where: { companyId },
      data: { isDefault: false },
    });

    const template = await prisma.serviceFormTemplate.update({
      where: { id },
      data: { isDefault: true },
    });

    res.json({
      id: template.id,
      name: template.name,
      isDefault: template.isDefault,
      fields: JSON.parse(template.fields),
      chipGroups: JSON.parse(template.chipGroups),
    });
  } catch (error: any) {
    console.error("SetDefaultServiceTemplate error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function deleteServiceTemplate(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id);
    const companyId = req.user!.companyId!;

    const existing = await prisma.serviceFormTemplate.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      res.status(404).json({ message: "Şablon bulunamadı." });
      return;
    }

    const count = await prisma.serviceFormTemplate.count({ where: { companyId } });

    if (count === 1) {
      res.status(400).json({ message: "En az bir şablon olmalıdır." });
      return;
    }

    await prisma.serviceFormTemplate.delete({ where: { id } });

    if (existing.isDefault) {
      const next = await prisma.serviceFormTemplate.findFirst({ where: { companyId } });
      if (next) {
        await prisma.serviceFormTemplate.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({ message: "Şablon silindi." });
  } catch (error: any) {
    console.error("DeleteServiceTemplate error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

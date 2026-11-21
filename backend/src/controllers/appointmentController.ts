import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export const JOB_STATUSES = ["AWAITING", "SCHEDULED", "DONE", "CANCELLED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
/** Takvimde gorunen isler; atama bekleyen ve iptal edilenler takvimde yok. */
const CALENDAR_STATUSES: JobStatus[] = ["SCHEDULED", "DONE"];

function mapAppointment(a: any) {
  return {
    id: a.id,
    customerName: a.customerName,
    customerId: a.customerId,
    ekip: a.teamName,
    ekipId: a.teamId,
    tarih: a.date,
    startTime: a.startTime,
    duration: a.duration,
    tur: a.serviceType,
    notes: a.notes,
    status: a.status,
    quoteId: a.quoteId ?? null,
    serviceRecordId: a.serviceRecordId ?? null,
    createdAt: a.createdAt,
  };
}

export async function getAppointments(req: AuthRequest, res: Response): Promise<void> {
  const companyId = req.user!.companyId!;
  const { date, teamId, from, to } = req.query;
  const page = parseInt(String(req.query.page || "0")) || 0;
  const size = parseInt(String(req.query.size || "0")) || 0;
  const paged = size > 0;

  const where: any = { companyId };
  const statusParam = typeof req.query.status === "string" ? req.query.status : "";
  const statuses = statusParam.split(",").filter((x): x is JobStatus => (JOB_STATUSES as readonly string[]).includes(x));
  where.status = { in: statuses.length ? statuses : CALENDAR_STATUSES };
  if (date) where.date = String(date);
  if (teamId) where.teamId = parseInt(String(teamId));
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = String(from);
    if (to) where.date.lte = String(to);
  }

  const orderBy = (statuses.length === 1 && statuses[0] === "AWAITING"
    ? [{ createdAt: "asc" }]
    : [{ date: "asc" }, { startTime: "asc" }]) as any;

  if (paged) {
    const [rows, totalElements] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: orderBy as any,
        skip: page * size,
        take: size,
      }),
      prisma.appointment.count({ where }),
    ]);
    res.json({
      content: rows.map(mapAppointment),
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      number: page,
      size,
    });
    return;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: orderBy as any,
  });

  res.json(appointments.map(mapAppointment));
}

export async function createAppointment(req: AuthRequest, res: Response): Promise<void> {
  const companyId = req.user!.companyId!;
  const { customerName, customerId, ekipId, tarih, startTime, duration, tur, notes, awaiting } = req.body;

  if (!customerName?.trim()) {
    res.status(400).json({ message: "Müşteri adı zorunludur." });
    return;
  }

  // Elle "atama bekleyen is": ekip ve tarih sonra atanir.
  if (awaiting === true) {
    if (!String(tur || "").trim()) {
      res.status(400).json({ message: "İş tanımı zorunludur." });
      return;
    }
    const job = await prisma.appointment.create({
      data: {
        customerName: customerName.trim(),
        customerId: customerId || null,
        serviceType: String(tur).trim(),
        notes: notes || "",
        status: "AWAITING",
        companyId,
      },
    });
    res.status(201).json(mapAppointment(job));
    return;
  }

  if (!ekipId) {
    res.status(400).json({ message: "Ekip seçimi zorunludur." });
    return;
  }
  if (!tarih) {
    res.status(400).json({ message: "Tarih zorunludur." });
    return;
  }

  const team = await prisma.team.findFirst({ where: { id: ekipId, companyId } });
  if (!team) {
    res.status(400).json({ message: "Geçersiz ekip." });
    return;
  }

  const appointment = await prisma.appointment.create({
    data: {
      customerName: customerName.trim(),
      customerId: customerId || null,
      teamName: team.name,
      teamId: ekipId,
      date: typeof tarih === "string" ? tarih : new Date(tarih).toISOString().split("T")[0],
      startTime: startTime || "09:00",
      duration: duration || "1saat",
      serviceType: tur || "Genel",
      notes: notes || "",
      companyId,
    },
  });

  res.status(201).json(mapAppointment(appointment));
}

export async function updateAppointment(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;
  const { customerName, customerId, ekipId, tarih, startTime, duration, tur, notes } = req.body;

  const existing = await prisma.appointment.findFirst({ where: { id, companyId } });
  if (!existing) {
    res.status(404).json({ message: "Randevu bulunamadı." });
    return;
  }

  if (existing.status === "CANCELLED" || existing.status === "DONE") {
    res.status(400).json({ message: "İptal edilmiş veya tamamlanmış iş güncellenemez." });
    return;
  }

  let teamName = existing.teamName;
  if (ekipId && ekipId !== existing.teamId) {
    const team = await prisma.team.findFirst({ where: { id: ekipId, companyId } });
    if (!team) {
      res.status(400).json({ message: "Geçersiz ekip." });
      return;
    }
    teamName = team.name;
  }

  const nextTeamId = ekipId || existing.teamId;
  const nextDate = tarih || existing.date;
  // Atama bekleyen iste ekip ve tarih birlikte verilmeli; verilince takvime gecer.
  let nextStatus = existing.status;
  if (existing.status === "AWAITING") {
    if (!nextTeamId || !nextDate) {
      res.status(400).json({ message: "Atama için ekip ve tarih zorunludur." });
      return;
    }
    nextStatus = "SCHEDULED";
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      customerName: customerName?.trim() || existing.customerName,
      customerId: customerId ?? existing.customerId,
      teamName: teamName,
      teamId: nextTeamId,
      date: nextDate,
      startTime: startTime || existing.startTime || "09:00",
      duration: duration || existing.duration || "1saat",
      status: nextStatus,
      serviceType: tur || existing.serviceType,
      notes: notes ?? existing.notes,
    },
  });

  res.json(mapAppointment(appointment));
}

export async function deleteAppointment(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;

  const existing = await prisma.appointment.findFirst({ where: { id, companyId } });
  if (!existing) {
    res.status(404).json({ message: "Randevu bulunamadı." });
    return;
  }

  await prisma.appointment.delete({ where: { id } });
  res.json({ message: "Randevu silindi." });
}


/** Tek is (servis formunu planli isten acmak icin). */
export async function getAppointment(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;
  const job = await prisma.appointment.findFirst({
    where: { id, companyId },
    include: { quote: { select: { id: true, title: true, lines: true } } },
  });
  if (!job) {
    res.status(404).json({ message: "Randevu bulunamadı." });
    return;
  }
  // Teklif kalemleri isle birlikte doner: servis formunu acan teknisyenin teklif
  // paneline erisimi olmasa da kalemler forma aktarilabilir.
  let quoteLines: unknown[] = [];
  if (job.quote) {
    try { quoteLines = JSON.parse(job.quote.lines || "[]"); } catch { quoteLines = []; }
  }
  res.json({ ...mapAppointment(job), quoteTitle: job.quote?.title ?? null, quoteLines });
}

/** Atama bekleyen ya da planli isi iptal eder (kayit silinmez, takvimden cikar). */
export async function cancelAppointment(req: AuthRequest, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id));
  const companyId = req.user!.companyId!;
  const { count } = await prisma.appointment.updateMany({
    where: { id, companyId, status: { in: ["AWAITING", "SCHEDULED"] } },
    data: { status: "CANCELLED" },
  });
  if (count === 0) {
    res.status(404).json({ message: "İptal edilebilecek iş bulunamadı." });
    return;
  }
  const job = await prisma.appointment.findFirst({ where: { id, companyId } });
  res.json(mapAppointment(job));
}

import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

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
  };
}

export async function getAppointments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const { date, teamId } = req.query;

    const where: any = { companyId };
    if (date) where.date = String(date);
    if (teamId) where.teamId = parseInt(String(teamId));

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    res.json(appointments.map(mapAppointment));
  } catch (error: any) {
    console.error("GetAppointments error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function createAppointment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const { customerName, customerId, ekip, ekipId, tarih, startTime, duration, tur, notes } = req.body;

    if (!customerName?.trim()) {
      res.status(400).json({ message: "Müşteri adı zorunludur." });
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
  } catch (error: any) {
    console.error("CreateAppointment error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateAppointment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const { customerName, customerId, ekip, ekipId, tarih, startTime, duration, tur, notes } = req.body;

    const existing = await prisma.appointment.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Randevu bulunamadı." });
      return;
    }

    let teamName = existing.teamName;
    if (ekipId && ekipId !== existing.teamId) {
      const team = await prisma.team.findFirst({ where: { id: ekipId, companyId } });
      if (team) teamName = team.name;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        customerName: customerName?.trim() || existing.customerName,
        customerId: customerId ?? existing.customerId,
        teamName: teamName,
        teamId: ekipId || existing.teamId,
        date: tarih || existing.date,
        startTime: startTime || existing.startTime,
        duration: duration || existing.duration,
        serviceType: tur || existing.serviceType,
        notes: notes ?? existing.notes,
      },
    });

    res.json(mapAppointment(appointment));
  } catch (error: any) {
    console.error("UpdateAppointment error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function deleteAppointment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;

    const existing = await prisma.appointment.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Randevu bulunamadı." });
      return;
    }

    await prisma.appointment.delete({ where: { id } });
    res.json({ message: "Randevu silindi." });
  } catch (error: any) {
    console.error("DeleteAppointment error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

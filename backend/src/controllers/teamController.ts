import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export async function getCompanyUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const users = await prisma.user.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (error: any) {
    console.error("GetCompanyUsers error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function getTeams(req: AuthRequest, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const teams = await prisma.team.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });
    const result = teams.map((t) => ({
      id: t.id,
      name: t.name,
      leader: t.leader,
      color: t.color,
      members: JSON.parse(t.members) as string[],
    }));
    res.json(result);
  } catch (error: any) {
    console.error("GetTeams error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function createTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, leader, color, members } = req.body;
    const companyId = req.user!.companyId!;

    if (!name?.trim()) {
      res.status(400).json({ message: "Ekip adı zorunludur." });
      return;
    }
    if (!leader?.trim()) {
      res.status(400).json({ message: "Ekip lideri zorunludur." });
      return;
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        leader: leader.trim(),
        color: color || "#3B82F6",
        members: JSON.stringify(Array.isArray(members) ? members : []),
        companyId,
      },
    });

    res.status(201).json({
      id: team.id,
      name: team.name,
      leader: team.leader,
      color: team.color,
      members: JSON.parse(team.members) as string[],
    });
  } catch (error: any) {
    console.error("CreateTeam error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function deleteTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;

    const existing = await prisma.team.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Ekip bulunamadı." });
      return;
    }

    await prisma.team.delete({ where: { id } });
    res.json({ message: "Ekip silindi." });
  } catch (error: any) {
    console.error("DeleteTeam error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

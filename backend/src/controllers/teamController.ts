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

export async function getTeamById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const team = await prisma.team.findFirst({ where: { id, companyId } });
    if (!team) {
      res.status(404).json({ message: "Ekip bulunamadı." });
      return;
    }
    res.json({
      id: team.id,
      name: team.name,
      leader: team.leader,
      color: team.color,
      members: JSON.parse(team.members) as string[],
    });
  } catch (error: any) {
    console.error("GetTeamById error:", error);
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

export async function updateTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const { name, leader, color, members } = req.body;

    const existing = await prisma.team.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Ekip bulunamadı." });
      return;
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        leader: leader?.trim() || existing.leader,
        color: color || existing.color,
        members: members ? JSON.stringify(members) : existing.members,
      },
    });

    res.json({
      id: team.id,
      name: team.name,
      leader: team.leader,
      color: team.color,
      members: JSON.parse(team.members) as string[],
    });
  } catch (error: any) {
    console.error("UpdateTeam error:", error);
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

export async function addMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const { name } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ message: "Personel adı zorunludur." });
      return;
    }

    const existing = await prisma.team.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Ekip bulunamadı." });
      return;
    }

    const members = JSON.parse(existing.members) as string[];
    if (members.includes(name.trim())) {
      res.status(400).json({ message: "Bu personel zaten ekipte mevcut." });
      return;
    }

    members.push(name.trim());
    const team = await prisma.team.update({
      where: { id },
      data: { members: JSON.stringify(members) },
    });

    res.json({
      id: team.id,
      name: team.name,
      leader: team.leader,
      color: team.color,
      members: JSON.parse(team.members) as string[],
    });
  } catch (error: any) {
    console.error("AddMember error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function removeMembers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const { members: removeList } = req.body;

    if (!Array.isArray(removeList) || removeList.length === 0) {
      res.status(400).json({ message: "Çıkarılacak personel belirtilmelidir." });
      return;
    }

    const existing = await prisma.team.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Ekip bulunamadı." });
      return;
    }

    const members = (JSON.parse(existing.members) as string[]).filter(
      (m) => !removeList.includes(m)
    );
    const team = await prisma.team.update({
      where: { id },
      data: { members: JSON.stringify(members) },
    });

    res.json({
      id: team.id,
      name: team.name,
      leader: team.leader,
      color: team.color,
      members: JSON.parse(team.members) as string[],
    });
  } catch (error: any) {
    console.error("RemoveMembers error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

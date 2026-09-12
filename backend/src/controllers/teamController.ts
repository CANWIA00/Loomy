import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

function serializeTeam(t: {
  id: number;
  name: string;
  leader: string;
  color: string;
  members: string;
}) {
  return {
    id: t.id,
    name: t.name,
    leader: t.leader,
    color: t.color,
    members: JSON.parse(t.members) as string[],
  };
}

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
    const result = teams.map((t) => serializeTeam(t));
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

    res.status(201).json(serializeTeam(team));
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

export async function updateTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const existing = await prisma.team.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Ekip bulunamadı." });
      return;
    }

    const { name, leader, color } = req.body || {};

    const data: Record<string, string> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({ message: "Ekip adı boş olamaz." });
        return;
      }
      data.name = name.trim();
    }

    if (leader !== undefined) {
      if (typeof leader !== "string" || !leader.trim()) {
        res.status(400).json({ message: "Ekip lideri zorunludur." });
        return;
      }
      data.leader = leader.trim();
    }

    if (color !== undefined) {
      data.color = color || existing.color;
    }

    let updatedMembers: string[] = JSON.parse(existing.members || "[]");

    if (data.leader && data.leader !== existing.leader) {
      if (updatedMembers.includes(data.leader)) {
        updatedMembers = updatedMembers.filter((m) => m !== data.leader);
      }
      if (!updatedMembers.includes(existing.leader) && existing.leader) {
        updatedMembers.push(existing.leader);
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: { ...data, members: JSON.stringify(updatedMembers) },
    });

    res.json(serializeTeam(team));
  } catch (error: any) {
    console.error("UpdateTeam error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function addTeamMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const existing = await prisma.team.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Ekip bulunamadı." });
      return;
    }

    const { name } = req.body || {};
    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ message: "Personel adı zorunludur." });
      return;
    }

    const trimmed = name.trim();
    const members: string[] = JSON.parse(existing.members || "[]");

    if (trimmed === existing.leader) {
      res.status(400).json({ message: "Bu kişi ekip lideridir." });
      return;
    }

    if (members.includes(trimmed)) {
      res.status(400).json({ message: "Bu kişi zaten ekipte." });
      return;
    }

    const team = await prisma.team.update({
      where: { id },
      data: { members: JSON.stringify([...members, trimmed]) },
    });

    res.json(serializeTeam(team));
  } catch (error: any) {
    console.error("AddTeamMember error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function removeTeamMembers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const existing = await prisma.team.findFirst({ where: { id, companyId } });
    if (!existing) {
      res.status(404).json({ message: "Ekip bulunamadı." });
      return;
    }

    const { members: toRemove } = req.body || {};
    const list = Array.isArray(toRemove) ? toRemove.filter((m: unknown) => typeof m === "string") : [];

    if (list.length === 0) {
      res.status(400).json({ message: "Kaldırılacak personel seçin." });
      return;
    }

    if (list.includes(existing.leader)) {
      res.status(400).json({ message: "Ekip lideri çıkarılamaz." });
      return;
    }

    const current: string[] = JSON.parse(existing.members || "[]");
    const next = current.filter((m) => !list.includes(m));

    const team = await prisma.team.update({
      where: { id },
      data: { members: JSON.stringify(next) },
    });

    res.json(serializeTeam(team));
  } catch (error: any) {
    console.error("RemoveTeamMembers error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

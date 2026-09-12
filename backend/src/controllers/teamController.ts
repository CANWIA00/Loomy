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

async function resolveMemberNames(members: string[], companyId: string): Promise<string[]> {
  const ids = [...new Set(members.filter((m) => m && m.includes("-") && !/\s/.test(m)))];
  if (ids.length === 0) return members;
  const users = await prisma.user.findMany({
    where: { id: { in: ids }, companyId },
    select: { id: true, name: true },
  });
  const map = Object.fromEntries(users.map((u) => [u.id, u.name]));
  return members.map((m) => (map[m] ? map[m] : m));
}

async function normalizeMembers(members: unknown[], companyId: string): Promise<string[]> {
  const list = (Array.isArray(members) ? members : [])
    .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
    .map((m) => m.trim());
  return resolveMemberNames(list, companyId);
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
    const result = await Promise.all(
      teams.map(async (t) => {
        const members = await resolveMemberNames(JSON.parse(t.members) as string[], companyId);
        return serializeTeam({ ...t, members: JSON.stringify(members) });
      })
    );
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

    const normalizedMembers = await normalizeMembers(members, companyId);

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        leader: leader.trim(),
        color: color || "#3B82F6",
        members: JSON.stringify(normalizedMembers),
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

    const { name, leader, color, members } = req.body || {};

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

    const finalLeader = data.leader || existing.leader;

    if (Array.isArray(members)) {
      const normalized = await normalizeMembers(members, companyId);
      data.members = JSON.stringify(normalized.filter((m) => m !== finalLeader));
    } else {
      let updatedMembers: string[] = JSON.parse(existing.members || "[]");
      if (data.leader && data.leader !== existing.leader) {
        updatedMembers = updatedMembers.filter((m) => m !== data.leader);
        if (!updatedMembers.includes(existing.leader) && existing.leader) {
          updatedMembers.push(existing.leader);
        }
      }
      const resolved = await resolveMemberNames(updatedMembers, companyId);
      data.members = JSON.stringify(resolved.filter((m) => m !== finalLeader));
    }

    const team = await prisma.team.update({
      where: { id },
      data,
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

    const [trimmed] = await resolveMemberNames([name.trim()], companyId);
    const members: string[] = JSON.parse(existing.members || "[]");
    const currentResolved = await resolveMemberNames(members, companyId);

    if (trimmed === existing.leader) {
      res.status(400).json({ message: "Bu kişi ekip lideridir." });
      return;
    }

    if (currentResolved.includes(trimmed)) {
      res.status(400).json({ message: "Bu kişi zaten ekipte." });
      return;
    }

    const team = await prisma.team.update({
      where: { id },
      data: { members: JSON.stringify([...currentResolved, trimmed]) },
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
    const currentResolved = await resolveMemberNames(current, companyId);
    const next = currentResolved.filter((m) => !list.includes(m));

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

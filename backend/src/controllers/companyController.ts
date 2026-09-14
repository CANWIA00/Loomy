import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { parsePanelAccessOrEmpty, normalizePanelAccess } from "../utils/panelAccess";

export async function getCompanyManagement(req: AuthRequest, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId!;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        invitationCode: true,
        _count: { select: { users: true } },
      },
    });

    if (!company) {
      res.status(404).json({ message: "Şirket bulunamadı." });
      return;
    }

    const users = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        panelAccess: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    res.json({
      company: { ...company, userCount: company._count.users, _count: undefined },
      users: users.map((u) => ({ ...u, panelAccess: parsePanelAccessOrEmpty(u.panelAccess) })),
    });
  } catch (error: any) {
    console.error("GetCompanyManagement error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateUserPanelAccess(req: AuthRequest, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const targetId = String(req.params.id);

    const user = await prisma.user.findFirst({
      where: { id: targetId, companyId },
      select: { id: true, role: true },
    });

    if (!user) {
      res.status(404).json({ message: "Kullanıcı bulunamadı." });
      return;
    }

    if (user.role === "ADMIN") {
      res.status(400).json({ message: "Admin kullanıcısının panel erişimi değiştirilemez." });
      return;
    }

    const panelAccess = normalizePanelAccess(req.body?.panelAccess);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { panelAccess: JSON.stringify(panelAccess) },
      select: { id: true, panelAccess: true },
    });

    res.json({ id: updated.id, panelAccess: parsePanelAccessOrEmpty(updated.panelAccess) });
  } catch (error: any) {
    console.error("UpdateUserPanelAccess error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function applyPanelAccessToAll(req: AuthRequest, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const panelAccess = normalizePanelAccess(req.body?.panelAccess);

    const result = await prisma.user.updateMany({
      where: { companyId, role: "USER" },
      data: { panelAccess: JSON.stringify(panelAccess) },
    });

    res.json({ updated: result.count, panelAccess });
  } catch (error: any) {
    console.error("ApplyPanelAccessToAll error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}
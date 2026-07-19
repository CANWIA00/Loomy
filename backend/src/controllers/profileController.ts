import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export async function getProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyId: true,
        signature: true,
        company: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            taxNumber: true,
            invitationCode: true,
            logoUrl: true,
            profileCompleted: true,
            _count: { select: { users: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: "Kullanıcı bulunamadı." });
      return;
    }

    const company = user.company
      ? {
          ...user.company,
          userCount: user.company._count.users,
          _count: undefined,
        }
      : null;

    res.json({ user, company });
  } catch (error: any) {
    console.error("GetProfile error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name, phone, signature } = req.body;

    if (!name || !phone) {
      res.status(400).json({ message: "İsim ve telefon zorunludur." });
      return;
    }

    const existingPhone = await prisma.user.findFirst({
      where: { phone, id: { not: req.user!.id } },
    });

    if (existingPhone) {
      res.status(400).json({ message: "Bu telefon numarası zaten kullanılıyor." });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, phone, signature: signature ?? undefined },
      select: { id: true, name: true, email: true, phone: true, role: true, signature: true },
    });

    res.json(user);
  } catch (error: any) {
    console.error("UpdateUser error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateCompany(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name, address, phone, email, taxNumber, logoUrl } = req.body;

    if (!name) {
      res.status(400).json({ message: "Şirket adı zorunludur." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      res.status(404).json({ message: "Şirket bulunamadı." });
      return;
    }

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: {
        name,
        address,
        phone,
        email,
        taxNumber,
        logoUrl,
        profileCompleted: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        taxNumber: true,
        invitationCode: true,
        logoUrl: true,
        profileCompleted: true,
      },
    });

    res.json(company);
  } catch (error: any) {
    console.error("UpdateCompany error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

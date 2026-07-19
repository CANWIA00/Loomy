import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma";
import { generateToken } from "../services/jwt";
import { AuthRequest } from "../middleware/auth";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, phone, password, inviteCode } = req.body;

    if (!name || !email || !phone || !password || !inviteCode) {
      res.status(400).json({ message: "Tüm alanlar zorunludur." });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      res.status(400).json({
        message:
          existingUser.email === email
            ? "Bu e-posta adresi zaten kullanılıyor."
            : "Bu telefon numarası zaten kullanılıyor.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (inviteCode.startsWith("ADMIN-")) {
      const adminKey = await prisma.adminKey.findUnique({
        where: { keyValue: inviteCode },
      });

      if (!adminKey) {
        res.status(400).json({ message: "Geçersiz admin davet kodu." });
        return;
      }

      if (!adminKey.isActive) {
        res.status(400).json({ message: "Bu admin davet kodu artık aktif değil." });
        return;
      }

      if (adminKey.isUsed) {
        res.status(400).json({ message: "Bu admin davet kodu zaten kullanılmış." });
        return;
      }

      const companyCode = `INVITE-${Date.now().toString(36).toUpperCase()}`;

      const company = await prisma.company.create({
        data: {
          name: `${name} Şirketi`,
          invitationCode: companyCode,
        },
      });

      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: "ADMIN",
          inviteCode,
          companyId: company.id,
        },
      });

      await prisma.adminKey.update({
        where: { id: adminKey.id },
        data: {
          isUsed: true,
          usedByCompanyId: company.id,
          usedAt: new Date(),
        },
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: company.id,
      });

      res.status(201).json({
        token,
        role: user.role,
        profileCompleted: company.profileCompleted,
      });
      return;
    }

    if (inviteCode.startsWith("INVITE-")) {
      const company = await prisma.company.findUnique({
        where: { invitationCode: inviteCode },
      });

      if (!company) {
        res.status(400).json({ message: "Geçersiz davet kodu." });
        return;
      }

      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: "USER",
          inviteCode,
          companyId: company.id,
        },
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: company.id,
      });

      res.status(201).json({
        token,
        role: user.role,
        profileCompleted: company.profileCompleted,
      });
      return;
    }

    res.status(400).json({
      message: "Geçersiz davet kodu formatı. ADMIN- veya INVITE- ile başlamalıdır.",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "E-posta ve şifre zorunludur." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      res.status(401).json({ message: "E-posta veya şifre hatalı." });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: "Hesabınız devre dışı bırakılmıştır." });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: "E-posta veya şifre hatalı." });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId ?? undefined,
    });

    res.json({
      token,
      role: user.role,
      profileCompleted: user.company?.profileCompleted ?? false,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ message: "Çıkış başarılı" });
}

export async function validate(req: AuthRequest, res: Response): Promise<void> {
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
      },
    });

    if (!user) {
      res.status(404).json({ message: "Kullanıcı bulunamadı." });
      return;
    }

    res.json(user);
  } catch (error: any) {
    console.error("Validate error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

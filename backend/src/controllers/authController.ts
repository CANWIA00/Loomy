import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma";
import { generateToken } from "../services/jwt";
import { AuthRequest } from "../middleware/auth";
import { generateVerificationCode, sendVerificationEmail } from "../services/email";

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
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

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
          verificationCode,
          verificationExpires,
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

      await sendVerificationEmail(email, verificationCode, name);

      res.status(201).json({
        requiresVerification: true,
        email,
        message: "Dogrulama kodu e-posta adresinize gonderildi.",
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

      if (company.isFrozen) {
        res.status(403).json({
          message:
            "Kullanımınız Loomy tarafından donduruldu. Yeni kayıt yapılamaz. Ödeme durumunuz için lütfen Loomy ile iletişime geçin.",
          frozen: true,
        });
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
          verificationCode,
          verificationExpires,
        },
      });

      await sendVerificationEmail(email, verificationCode, name);

      res.status(201).json({
        requiresVerification: true,
        email,
        message: "Dogrulama kodu e-posta adresinize gonderildi.",
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

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ message: "E-posta ve dogrulama kodu zorunludur." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      res.status(404).json({ message: "Kullanici bulunamadi." });
      return;
    }

    if (user.company?.isFrozen) {
      res.status(403).json({
        message:
          "Kullanımınız Loomy tarafından donduruldu. Ödeme durumunuz için lütfen Loomy ile iletişime geçin.",
        frozen: true,
      });
      return;
    }

    if (user.emailVerified) {
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
      return;
    }

    if (!user.verificationCode || !user.verificationExpires) {
      res.status(400).json({ message: "Dogrulama kodu bulunamadi. Lutfen yeni bir kod isteyin." });
      return;
    }

    if (new Date() > user.verificationExpires) {
      res.status(400).json({ message: "Dogrulama kodunun suresi dolmus. Lutfen yeni bir kod isteyin." });
      return;
    }

    if (user.verificationCode !== code.trim()) {
      res.status(400).json({ message: "Gecersiz dogrulama kodu." });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
    });

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
    console.error("Verify email error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "E-posta adresi zorunludur." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ message: "Kullanici bulunamadi." });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ message: "E-posta adresi zaten dogrulanmis." });
      return;
    }

    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationExpires,
      },
    });

    await sendVerificationEmail(email, verificationCode, user.name);

    res.json({ message: "Yeni dogrulama kodu e-posta adresinize gonderildi." });
  } catch (error: any) {
    console.error("Resend verification error:", error);
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

    if (user.company?.isFrozen) {
      res.status(403).json({
        message:
          "Kullanımınız Loomy tarafından donduruldu. Ödeme durumunuz için lütfen Loomy ile iletişime geçin.",
        frozen: true,
      });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        message: "E-posta adresiniz doğrulanmamış. Lütfen e-posta doğrulamanızı tamamlayın.",
        requiresVerification: true,
        email: user.email,
      });
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

export async function deleteAccount(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { company: true },
    });

    if (!user) {
      res.status(404).json({ message: "Kullanıcı bulunamadı." });
      return;
    }

    await prisma.user.delete({ where: { id: user.id } });

    if (user.companyId) {
      const remainingUsers = await prisma.user.count({
        where: { companyId: user.companyId },
      });

      if (remainingUsers === 0) {
        await prisma.company.delete({ where: { id: user.companyId } });
      }
    }

    res.json({ message: "Hesap başarıyla silindi." });
  } catch (error: any) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

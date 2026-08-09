import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/jwt";
import prisma from "../prisma";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Yetkilendirme hatası. Token bulunamadı." });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        companyId: true,
        company: { select: { isFrozen: true } },
      },
    });

    if (!user) {
      res.status(401).json({ message: "Kullanıcı bulunamadı." });
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

    req.user = { id: user.id, email: user.email, role: user.role, companyId: decoded.companyId || user.companyId || undefined };
    next();
  } catch (error) {
    res.status(401).json({ message: "Geçersiz veya süresi dolmuş token." });
  }
}

export function isAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ message: "Bu işlem için admin yetkisi gereklidir." });
    return;
  }
  next();
}

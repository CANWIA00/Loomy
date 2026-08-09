import { Request, Response, NextFunction } from "express";
import { verifyDevToken } from "../services/jwt";

export async function devAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Yetkilendirme hatası. Dev token bulunamadı." });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyDevToken(token);

    if (!decoded.dev) {
      res.status(403).json({ message: "Bu işlem için dev yetkisi gereklidir." });
      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Geçersiz veya süresi dolmuş dev token." });
  }
}

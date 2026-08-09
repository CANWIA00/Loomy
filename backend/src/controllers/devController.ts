import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../prisma";
import { Role } from "@prisma/client";
import { generateDevToken } from "../services/jwt";

function paramId(req: Request): string {
  return String(req.params.id);
}

function generateAdminKeyValue(): string {
  return `ADMIN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function generateTempPassword(): string {
  return crypto.randomBytes(5).toString("base64url");
}

export async function devLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "E-posta ve şifre zorunludur." });
      return;
    }

    const expectedEmail = process.env.DEV_EMAIL;
    const expectedPassword = process.env.DEV_PASSWORD;

    if (!expectedEmail || !expectedPassword) {
      res.status(500).json({ message: "Dev giriş bilgileri yapılandırılmamış." });
      return;
    }

    const emailOk = email.trim().toLowerCase() === expectedEmail.trim().toLowerCase();
    const passwordOk =
      Buffer.byteLength(password) === Buffer.byteLength(expectedPassword) &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword));

    if (!emailOk || !passwordOk) {
      res.status(401).json({ message: "E-posta veya şifre hatalı." });
      return;
    }

    const token = generateDevToken();
    res.json({ token, email: email.trim().toLowerCase() });
  } catch (error: any) {
    console.error("Dev login error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const [companies, users, adminKeys, usedKeys, activeKeys, customers, services, teams, appointments] =
      await Promise.all([
        prisma.company.count(),
        prisma.user.count(),
        prisma.adminKey.count(),
        prisma.adminKey.count({ where: { isUsed: true } }),
        prisma.adminKey.count({ where: { isActive: true } }),
        prisma.customer.count(),
        prisma.serviceRecord.count(),
        prisma.team.count(),
        prisma.appointment.count(),
      ]);

    res.json({
      companies,
      users,
      adminKeys,
      usedKeys,
      activeKeys,
      customers,
      services,
      teams,
      appointments,
    });
  } catch (error: any) {
    console.error("Dev stats error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function listAdminKeys(_req: Request, res: Response): Promise<void> {
  try {
    const keys = await prisma.adminKey.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: { select: { id: true, name: true } } },
    });
    res.json(keys);
  } catch (error: any) {
    console.error("Dev listAdminKeys error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function createAdminKey(req: Request, res: Response): Promise<void> {
  try {
    const { count = 1 } = req.body;
    const n = Math.min(Math.max(parseInt(count, 10) || 1, 1), 20);

    const created: { keyValue: string }[] = [];
    for (let i = 0; i < n; i++) {
      let keyValue = generateAdminKeyValue();
      let existing = await prisma.adminKey.findUnique({ where: { keyValue } });
      while (existing) {
        keyValue = generateAdminKeyValue();
        existing = await prisma.adminKey.findUnique({ where: { keyValue } });
      }
      const key = await prisma.adminKey.create({ data: { keyValue } });
      created.push({ keyValue: key.keyValue });
    }

    res.status(201).json({ created });
  } catch (error: any) {
    console.error("Dev createAdminKey error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateAdminKey(req: Request, res: Response): Promise<void> {
  try {
    const id = paramId(req);
    const { isActive, isUsed } = req.body;

    const key = await prisma.adminKey.findUnique({ where: { id } });
    if (!key) {
      res.status(404).json({ message: "Admin key bulunamadı." });
      return;
    }

    const data: { isActive?: boolean; isUsed?: boolean; usedByCompanyId?: string | null; usedAt?: Date | null } = {};
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (typeof isUsed === "boolean") {
      data.isUsed = isUsed;
      if (isUsed === false) {
        data.usedByCompanyId = null;
        data.usedAt = null;
      }
    }

    const updated = await prisma.adminKey.update({ where: { id }, data });
    res.json(updated);
  } catch (error: any) {
    console.error("Dev updateAdminKey error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function deleteAdminKey(req: Request, res: Response): Promise<void> {
  try {
    const id = paramId(req);
    await prisma.adminKey.delete({ where: { id } });
    res.json({ message: "Admin key silindi." });
  } catch (error: any) {
    console.error("Dev deleteAdminKey error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        inviteCode: true,
        createdAt: true,
        company: { select: { id: true, name: true, profileCompleted: true } },
      },
    });
    res.json(users);
  } catch (error: any) {
    console.error("Dev listUsers error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = paramId(req);
    const { isActive, role, resetPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: "Kullanıcı bulunamadı." });
      return;
    }

    const data: { isActive?: boolean; role?: Role; password?: string } = {};
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (role === "ADMIN" || role === "USER") data.role = role as Role;

    let tempPassword: string | undefined;
    if (resetPassword) {
      tempPassword = generateTempPassword();
      data.password = await bcrypt.hash(tempPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, emailVerified: true },
    });

    res.json(tempPassword ? { ...updated, tempPassword } : updated);
  } catch (error: any) {
    console.error("Dev updateUser error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const id = paramId(req);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: "Kullanıcı bulunamadı." });
      return;
    }

    const companyId = user.companyId;
    await prisma.user.delete({ where: { id } });

    if (companyId) {
      const remainingUsers = await prisma.user.count({ where: { companyId } });
      if (remainingUsers === 0) {
        await prisma.company.delete({ where: { id: companyId } });
      }
    }

    res.json({ message: "Kullanıcı silindi." });
  } catch (error: any) {
    console.error("Dev deleteUser error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function listCompanies(_req: Request, res: Response): Promise<void> {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, customers: true, serviceRecords: true, teams: true, appointments: true } },
      },
    });
    res.json(companies);
  } catch (error: any) {
    console.error("Dev listCompanies error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function getCompany(req: Request, res: Response): Promise<void> {
  try {
    const id = paramId(req);

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, emailVerified: true, createdAt: true } },
        adminKeys: { select: { id: true, keyValue: true, isUsed: true, isActive: true, usedAt: true } },
        _count: { select: { customers: true, serviceRecords: true, teams: true, appointments: true } },
      },
    });

    if (!company) {
      res.status(404).json({ message: "Şirket bulunamadı." });
      return;
    }

    res.json(company);
  } catch (error: any) {
    console.error("Dev getCompany error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateCompany(req: Request, res: Response): Promise<void> {
  try {
    const id = paramId(req);
    const { isFrozen, markPaid } = req.body;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      res.status(404).json({ message: "Şirket bulunamadı." });
      return;
    }

    const data: { isFrozen?: boolean; paidUntil?: Date } = {};
    if (typeof isFrozen === "boolean") data.isFrozen = isFrozen;

    if (markPaid === true) {
      const base = company.paidUntil && company.paidUntil > new Date() ? company.paidUntil : new Date();
      const paidUntil = new Date(base);
      paidUntil.setMonth(paidUntil.getMonth() + 1);
      data.paidUntil = paidUntil;
    }

    const updated = await prisma.company.update({
      where: { id },
      data,
      include: {
        _count: { select: { users: true, customers: true, serviceRecords: true, teams: true, appointments: true } },
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Dev updateCompany error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

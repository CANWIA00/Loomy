import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export async function getCustomers(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 20;
    const companyId = req.user!.companyId!;

    const [content, totalElements] = await Promise.all([
      prisma.customer.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        skip: page * size,
        take: size,
      }),
      prisma.customer.count({ where: { companyId } }),
    ]);

    res.json({
      content,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      number: page,
      size,
    });
  } catch (error: any) {
    console.error("GetCustomers error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function searchCustomers(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 20;
    const q = String(req.query.q || "");
    const companyId = req.user!.companyId!;

    const where = {
      companyId,
      OR: [
        { companyName: { contains: q, mode: "insensitive" as const } },
        { contactPerson: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q } },
      ],
    };

    const [content, totalElements] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: page * size,
        take: size,
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      content,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      number: page,
      size,
    });
  } catch (error: any) {
    console.error("SearchCustomers error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function getAllCustomersSimple(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const customers = await prisma.customer.findMany({
      where: { companyId },
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true, contactPerson: true, phone: true, address: true },
    });
    res.json(customers);
  } catch (error: any) {
    console.error("GetAllCustomersSimple error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function getCustomerById(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id);
    const companyId = req.user!.companyId!;

    const customer = await prisma.customer.findFirst({
      where: { id, companyId },
    });

    if (!customer) {
      res.status(404).json({ message: "Müşteri bulunamadı." });
      return;
    }

    res.json(customer);
  } catch (error: any) {
    console.error("GetCustomerById error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function createCustomer(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const {
      companyName,
      address,
      email,
      phone,
      contactPerson,
      contactPhone,
      monthlyFee,
      hasPaidMonthly,
      lastPaidAt,
    } = req.body;
    const companyId = req.user!.companyId!;

    if (!companyName?.trim()) {
      res.status(400).json({ message: "Şirket adı zorunludur." });
      return;
    }

    const customer = await prisma.customer.create({
      data: {
        companyName: companyName.trim(),
        address: address?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        monthlyFee: monthlyFee ?? "0.00",
        hasPaidMonthly: hasPaidMonthly ?? false,
        lastPaidAt: lastPaidAt ? new Date(lastPaidAt) : null,
        companyId,
      },
    });

    res.status(201).json(customer);
  } catch (error: any) {
    console.error("CreateCustomer error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updateCustomer(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id);
    const companyId = req.user!.companyId!;
    const {
      companyName,
      address,
      email,
      phone,
      contactPerson,
      contactPhone,
      monthlyFee,
      hasPaidMonthly,
      lastPaidAt,
    } = req.body;

    const existing = await prisma.customer.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      res.status(404).json({ message: "Müşteri bulunamadı." });
      return;
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        companyName: companyName?.trim() || existing.companyName,
        address: address?.trim() ?? existing.address,
        email: email?.trim() ?? existing.email,
        phone: phone?.trim() ?? existing.phone,
        contactPerson: contactPerson?.trim() ?? existing.contactPerson,
        contactPhone: contactPhone?.trim() ?? existing.contactPhone,
        monthlyFee: monthlyFee ?? existing.monthlyFee,
        hasPaidMonthly: hasPaidMonthly ?? existing.hasPaidMonthly,
        lastPaidAt: lastPaidAt ? new Date(lastPaidAt) : lastPaidAt === null ? null : existing.lastPaidAt,
      },
    });

    res.json(customer);
  } catch (error: any) {
    console.error("UpdateCustomer error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function deleteCustomer(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id);
    const companyId = req.user!.companyId!;

    const existing = await prisma.customer.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      res.status(404).json({ message: "Müşteri bulunamadı." });
      return;
    }

    await prisma.customer.delete({ where: { id } });
    res.json({ message: "Müşteri silindi." });
  } catch (error: any) {
    console.error("DeleteCustomer error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

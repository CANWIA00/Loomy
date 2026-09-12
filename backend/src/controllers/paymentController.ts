import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export async function getPayments(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 50;
    const companyId = req.user!.companyId!;

    const [content, totalElements] = await Promise.all([
      prisma.serviceRecord.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        skip: page * size,
        take: size,
        select: {
          id: true,
          customerName: true,
          customerId: true,
          documentDate: true,
          serviceType: true,
          fee: true,
          paid: true,
        },
      }),
      prisma.serviceRecord.count({ where: { companyId } }),
    ]);

    const mapped = content.map((r) => ({
      id: r.id,
      customer: r.customerName,
      customerId: r.customerId,
      tarih: r.documentDate,
      serviceType: r.serviceType || "",
      amount: parseFloat(r.fee) || 0,
      paid: r.paid,
    }));

    res.json({
      content: mapped,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      number: page,
      size,
    });
  } catch (error: any) {
    console.error("GetPayments error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function getPaymentSummary(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;

    const [row] = await prisma.$queryRaw<Array<{
      paidTotal: number;
      pendingTotal: number;
      paidCount: number;
      pendingCount: number;
      totalCount: number;
    }>>`
      SELECT
        COALESCE(SUM(CASE WHEN "paid" THEN CAST("fee" AS numeric) ELSE 0 END), 0)::float8 AS "paidTotal",
        COALESCE(SUM(CASE WHEN NOT "paid" THEN CAST("fee" AS numeric) ELSE 0 END), 0)::float8 AS "pendingTotal",
        COUNT(*) FILTER (WHERE "paid")::int AS "paidCount",
        COUNT(*) FILTER (WHERE NOT "paid")::int AS "pendingCount",
        COUNT(*)::int AS "totalCount"
      FROM "ServiceRecord"
      WHERE "companyId" = ${companyId}
    `;

    const r = row || { paidTotal: 0, pendingTotal: 0, paidCount: 0, pendingCount: 0, totalCount: 0 };
    res.json({
      paidTotal: Number(r.paidTotal) || 0,
      pendingTotal: Number(r.pendingTotal) || 0,
      total: (Number(r.paidTotal) || 0) + (Number(r.pendingTotal) || 0),
      paidCount: r.paidCount || 0,
      pendingCount: r.pendingCount || 0,
      totalCount: r.totalCount || 0,
    });
  } catch (error: any) {
    console.error("GetPaymentSummary error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function updatePaymentStatus(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = parseInt(String(req.params.id));
    const companyId = req.user!.companyId!;
    const { paid } = req.body;

    const existing = await prisma.serviceRecord.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      res.status(404).json({ message: "Servis kaydı bulunamadı." });
      return;
    }

    const record = await prisma.serviceRecord.update({
      where: { id },
      data: { paid: paid ?? !existing.paid },
      select: {
        id: true,
        customerName: true,
        customerId: true,
        documentDate: true,
        serviceType: true,
        fee: true,
        paid: true,
      },
    });

    res.json({
      id: record.id,
      customer: record.customerName,
      customerId: record.customerId,
      tarih: record.documentDate,
      serviceType: record.serviceType || "",
      amount: parseFloat(record.fee) || 0,
      paid: record.paid,
    });
  } catch (error: any) {
    console.error("UpdatePaymentStatus error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

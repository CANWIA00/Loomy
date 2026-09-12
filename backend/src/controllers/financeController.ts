import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export async function getFinanceOverview(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;

    const [stockRaw, expenseRaw, paymentRaw] = await Promise.all([
      prisma.$queryRaw<Array<{ currency: string; total: number }>>`
        SELECT "currency", COALESCE(SUM("quantity" * "unitPrice"), 0)::float8 AS total
        FROM "StockItem"
        WHERE "companyId" = ${companyId} AND "unitPrice" IS NOT NULL
        GROUP BY "currency"
      `,
      prisma.$queryRaw<Array<{ currency: string; total: number }>>`
        SELECT "currency", COALESCE(SUM("totalAmount"), 0)::float8 AS total
        FROM "Invoice"
        WHERE "companyId" = ${companyId} AND "totalAmount" IS NOT NULL
        GROUP BY "currency"
      `,
      prisma.$queryRaw<Array<{
        paidTotal: number;
        pendingTotal: number;
        paidCount: number;
        pendingCount: number;
      }>>`
        SELECT
          COALESCE(SUM(CASE WHEN "paid" THEN CAST("fee" AS numeric) ELSE 0 END), 0)::float8 AS "paidTotal",
          COALESCE(SUM(CASE WHEN NOT "paid" THEN CAST("fee" AS numeric) ELSE 0 END), 0)::float8 AS "pendingTotal",
          COUNT(*) FILTER (WHERE "paid")::int AS "paidCount",
          COUNT(*) FILTER (WHERE NOT "paid")::int AS "pendingCount"
        FROM "ServiceRecord"
        WHERE "companyId" = ${companyId}
      `,
    ]);

    const stockByCurrency: Record<string, number> = {};
    stockRaw.forEach((r) => {
      stockByCurrency[r.currency] = Number(r.total) || 0;
    });

    const expenseByCurrency: Record<string, number> = {};
    expenseRaw.forEach((r) => {
      expenseByCurrency[r.currency] = Number(r.total) || 0;
    });

    const pr = paymentRaw[0] || { paidTotal: 0, pendingTotal: 0, paidCount: 0, pendingCount: 0 };

    res.json({
      stockByCurrency,
      expenseByCurrency,
      paidTotal: Number(pr.paidTotal) || 0,
      pendingTotal: Number(pr.pendingTotal) || 0,
      paidCount: pr.paidCount || 0,
      pendingCount: pr.pendingCount || 0,
    });
  } catch (error: any) {
    console.error("GetFinanceOverview error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}
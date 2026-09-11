import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";

export async function getFinanceOverview(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;

    const [stockItems, invoices, serviceRecords] = await Promise.all([
      prisma.stockItem.findMany({
        where: { companyId },
        select: { quantity: true, unitPrice: true, currency: true },
      }),
      prisma.invoice.findMany({
        where: { companyId },
        select: { totalAmount: true, currency: true },
      }),
      prisma.serviceRecord.findMany({
        where: { companyId },
        select: { fee: true, paid: true },
      }),
    ]);

    const stockByCurrency: Record<string, number> = {};
    stockItems.forEach((i) => {
      if (i.unitPrice == null) return;
      const cur = i.currency || "TRY";
      stockByCurrency[cur] = (stockByCurrency[cur] || 0) + i.quantity * i.unitPrice;
    });

    const expenseByCurrency: Record<string, number> = {};
    invoices.forEach((inv) => {
      if (inv.totalAmount == null) return;
      const cur = inv.currency || "TRY";
      expenseByCurrency[cur] = (expenseByCurrency[cur] || 0) + inv.totalAmount;
    });

    let paidTotal = 0;
    let pendingTotal = 0;
    let paidCount = 0;
    let pendingCount = 0;
    serviceRecords.forEach((r) => {
      const fee = parseFloat(r.fee) || 0;
      if (r.paid) {
        paidTotal += fee;
        paidCount += 1;
      } else {
        pendingTotal += fee;
        pendingCount += 1;
      }
    });

    res.json({
      stockByCurrency,
      expenseByCurrency,
      paidTotal,
      pendingTotal,
      paidCount,
      pendingCount,
    });
  } catch (error: any) {
    console.error("GetFinanceOverview error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}
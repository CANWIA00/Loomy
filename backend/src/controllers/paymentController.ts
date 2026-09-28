import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import {
  periodKey,
  ensureBackfill,
  ensureFresh,
  scheduleRecomputeForRecord,
} from "../services/monthlySummaries";

const PAYMENT_SELECT = {
  id: true,
  customerName: true,
  customerId: true,
  documentDate: true,
  serviceType: true,
  fee: true,
  paid: true,
  invoiced: true,
} as const;

function toPaymentDto(record: {
  id: number;
  customerName: string;
  customerId: string | null;
  documentDate: string;
  serviceType: string;
  fee: string;
  paid: boolean;
  invoiced: boolean;
}) {
  return {
    id: record.id,
    customer: record.customerName,
    customerId: record.customerId,
    tarih: record.documentDate,
    serviceType: record.serviceType || "",
    amount: parseFloat(record.fee) || 0,
    paid: record.paid,
    invoiced: record.invoiced,
  };
}

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
        select: PAYMENT_SELECT,
      }),
      prisma.serviceRecord.count({ where: { companyId } }),
    ]);

    const mapped = content.map(toPaymentDto);

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

    await ensureBackfill(companyId);
    const now = new Date();
    await ensureFresh(companyId, [
      periodKey(now),
      periodKey(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    ]);

    const rows = await prisma.monthlyFinanceSummary.findMany({
      where: { companyId },
      select: {
        receivedTotal: true,
        pendingTotal: true,
        receivedCount: true,
        pendingCount: true,
      },
    });

    let paidTotal = 0;
    let pendingTotal = 0;
    let paidCount = 0;
    let pendingCount = 0;
    rows.forEach((r) => {
      paidTotal += r.receivedTotal || 0;
      pendingTotal += r.pendingTotal || 0;
      paidCount += r.receivedCount || 0;
      pendingCount += r.pendingCount || 0;
    });

    res.json({
      paidTotal: Number(paidTotal) || 0,
      pendingTotal: Number(pendingTotal) || 0,
      total: (Number(paidTotal) || 0) + (Number(pendingTotal) || 0),
      paidCount: paidCount || 0,
      pendingCount: pendingCount || 0,
      totalCount: (paidCount || 0) + (pendingCount || 0),
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
    const { paid, invoiced } = req.body;

    const existing = await prisma.serviceRecord.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      res.status(404).json({ message: "Servis kaydı bulunamadı." });
      return;
    }

    const data: { paid?: boolean; invoiced?: boolean } = {};
    if (typeof paid === "boolean") data.paid = paid;
    if (typeof invoiced === "boolean") data.invoiced = invoiced;
    if (data.paid === undefined && data.invoiced === undefined) {
      data.paid = !existing.paid;
    }

    const record = await prisma.serviceRecord.update({
      where: { id },
      data,
      select: PAYMENT_SELECT,
    });

    if (data.paid !== undefined) {
      await scheduleRecomputeForRecord(companyId, existing.documentDate, existing.createdAt as any);
    }

    res.json(toPaymentDto(record));
  } catch (error: any) {
    console.error("UpdatePaymentStatus error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

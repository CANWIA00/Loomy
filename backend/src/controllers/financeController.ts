import { Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import {
  periodKey,
  ensureBackfill,
  ensureFresh,
} from "../services/monthlySummaries";

const PERIOD_RE = /^\d{4}-\d{2}$/;
const YEAR_RE = /^\d{4}$/;

function parseCurrencyMap(json: string | null): Record<string, number> {
  try {
    const parsed = JSON.parse(json || "{}");
    const out: Record<string, number> = {};
    Object.entries(parsed).forEach(([cur, val]) => {
      out[cur] = Number(val) || 0;
    });
    return out;
  } catch {
    return {};
  }
}

export async function getFinanceOverview(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const now = new Date();
    const currentPeriod = periodKey(now);
    const prevPeriod = periodKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const monthParam = req.query.month;
    const raw = typeof monthParam === "string" ? monthParam : null;
    const isMonth = !!raw && PERIOD_RE.test(raw);
    const isYear = !!raw && YEAR_RE.test(raw);
    const month = isMonth ? raw : null;
    const year = isYear ? raw : null;
    const fetchFrom = month || (year ? `${year}-01` : null);

    await ensureBackfill(companyId);
    await ensureFresh(companyId, [currentPeriod, prevPeriod]);

    const [stockRaw, summaries, availRaw] = await Promise.all([
      prisma.$queryRaw<Array<{ currency: string; total: number }>>`
        SELECT "currency", COALESCE(SUM("quantity" * "unitPrice"), 0)::float8 AS total
        FROM "StockItem"
        WHERE "companyId" = ${companyId} AND "unitPrice" IS NOT NULL
        GROUP BY "currency"
      `,
      prisma.monthlyFinanceSummary.findMany({
        where: fetchFrom ? { companyId, period: { gte: fetchFrom } } : { companyId },
      }),
      prisma.monthlyFinanceSummary.findMany({
        where: { companyId },
        select: { period: true },
        distinct: ["period"],
        orderBy: { period: "desc" as const },
      }),
    ]);

    const availablePeriods: string[] = availRaw.map((r: any) => r.period);

    if (fetchFrom) {
      const stockBase: Record<string, number> = {};
      stockRaw.forEach((r) => {
        stockBase[r.currency] = Number(r.total) || 0;
      });

      const suffixThreshold = month || (year ? `${year}-12` : null);
      const suffix: Record<string, number> = {};
      summaries.forEach((row: any) => {
        if (suffixThreshold && row.period <= suffixThreshold) return;
        const delta = parseCurrencyMap(row.stockDeltaByCurrency);
        Object.entries(delta).forEach(([cur, val]) => {
          suffix[cur] = (suffix[cur] || 0) + val;
        });
      });

      const stockByCurrency: Record<string, number> = {};
      Object.entries(stockBase).forEach(([cur, base]) => {
        stockByCurrency[cur] = base - (suffix[cur] || 0);
      });

      let expenseByCurrency: Record<string, number> = {};
      let paidTotal = 0;
      let pendingTotal = 0;
      let paidCount = 0;
      let pendingCount = 0;

      if (month) {
        const row = summaries.find((r: any) => r.period === month) as any;
        expenseByCurrency = parseCurrencyMap(row?.expenseByCurrency ?? null);
        paidTotal = Number(row?.receivedTotal) || 0;
        pendingTotal = Number(row?.pendingTotal) || 0;
        paidCount = row?.receivedCount || 0;
        pendingCount = row?.pendingCount || 0;
      } else if (year) {
        const nextYearStart = `${String(Number(year) + 1)}-01`;
        summaries.forEach((row: any) => {
          if (row.period < fetchFrom || row.period >= nextYearStart) return;
          const exp = parseCurrencyMap(row.expenseByCurrency);
          Object.entries(exp).forEach(([cur, val]) => {
            expenseByCurrency[cur] = (expenseByCurrency[cur] || 0) + val;
          });
          paidTotal += row.receivedTotal || 0;
          pendingTotal += row.pendingTotal || 0;
          paidCount += row.receivedCount || 0;
          pendingCount += row.pendingCount || 0;
        });
      }

      res.json({
        period: month || year,
        availablePeriods,
        stockByCurrency,
        expenseByCurrency,
        paidTotal,
        pendingTotal,
        paidCount,
        pendingCount,
      });
      return;
    }

    const stockByCurrency: Record<string, number> = {};
    stockRaw.forEach((r) => {
      stockByCurrency[r.currency] = Number(r.total) || 0;
    });

    const expenseByCurrency: Record<string, number> = {};
    let paidTotal = 0;
    let pendingTotal = 0;
    let paidCount = 0;
    let pendingCount = 0;
    summaries.forEach((r: any) => {
      const exp = parseCurrencyMap(r.expenseByCurrency);
      Object.entries(exp).forEach(([cur, val]) => {
        expenseByCurrency[cur] = (expenseByCurrency[cur] || 0) + val;
      });
      paidTotal += r.receivedTotal || 0;
      pendingTotal += r.pendingTotal || 0;
      paidCount += r.receivedCount || 0;
      pendingCount += r.pendingCount || 0;
    });

    res.json({
      period: null,
      availablePeriods,
      stockByCurrency,
      expenseByCurrency,
      paidTotal: Number(paidTotal) || 0,
      pendingTotal: Number(pendingTotal) || 0,
      paidCount: paidCount || 0,
      pendingCount: pendingCount || 0,
    });
  } catch (error: any) {
    console.error("GetFinanceOverview error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}

export async function getFinanceTimeline(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;
    const months = Math.min(Math.max(parseInt(String(req.query.months)) || 12, 1), 24);

    const periods: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      periods.push(periodKey(d));
    }

    await ensureBackfill(companyId);
    await ensureFresh(companyId, periods);

    const [baseStockRaw, summaries] = await Promise.all([
      prisma.$queryRaw<Array<{ currency: string; total: number }>>`
        SELECT "currency", COALESCE(SUM("quantity" * "unitPrice"), 0)::float8 AS total
        FROM "StockItem"
        WHERE "companyId" = ${companyId} AND "unitPrice" IS NOT NULL
        GROUP BY "currency"
      `,
      prisma.monthlyFinanceSummary.findMany({
        where: { companyId, period: { in: periods } },
      }),
    ]);

    const stockBase: Record<string, number> = {};
    baseStockRaw.forEach((r) => {
      stockBase[r.currency] = Number(r.total) || 0;
    });

    const stockDeltaByPeriod: Record<string, Record<string, number>> = {};
    const expenseByPeriod: Record<string, Record<string, number>> = {};
    const receivedByPeriod: Record<string, number> = {};
    const pendingByPeriod: Record<string, number> = {};

    summaries.forEach((row) => {
      let stockDelta: Record<string, number> = {};
      let expense: Record<string, number> = {};
      try {
        stockDelta = JSON.parse(row.stockDeltaByCurrency || "{}");
        expense = JSON.parse(row.expenseByCurrency || "{}");
      } catch {
        // ignore malformed row
      }
      stockDeltaByPeriod[row.period] = stockDelta;
      expenseByPeriod[row.period] = expense;
      receivedByPeriod[row.period] = row.receivedTotal || 0;
      pendingByPeriod[row.period] = row.pendingTotal || 0;
    });

    const currencies = Array.from(
      new Set([...Object.keys(stockBase), ...summaries.flatMap((r) => Object.keys(stockDeltaByPeriod[r.period] || {}))])
    );
    const stockByCurrency: Record<string, number[]> = {};
    for (const cur of currencies) {
      const values: number[] = new Array<number>(periods.length).fill(0);
      let suffix = 0;
      for (let i = periods.length - 1; i >= 0; i--) {
        values[i] = (stockBase[cur] || 0) - suffix;
        suffix += stockDeltaByPeriod[periods[i]]?.[cur] || 0;
      }
      stockByCurrency[cur] = values;
    }

    const expenseByCurrency: Record<string, number[]> = {};
    const received = new Array<number>(periods.length).fill(0);
    const pending = new Array<number>(periods.length).fill(0);
    periods.forEach((period, idx) => {
      Object.entries(expenseByPeriod[period] || {}).forEach(([cur, val]) => {
        if (!expenseByCurrency[cur]) expenseByCurrency[cur] = new Array<number>(periods.length).fill(0);
        expenseByCurrency[cur][idx] = Number(val) || 0;
      });
      received[idx] = receivedByPeriod[period] || 0;
      pending[idx] = pendingByPeriod[period] || 0;
    });

    res.json({
      months,
      periods,
      stockByCurrency,
      expenseByCurrency,
      received,
      pending,
    });
  } catch (error: any) {
    console.error("GetFinanceTimeline error:", error);
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
}
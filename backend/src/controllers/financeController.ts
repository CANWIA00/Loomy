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

      const firstStock = await firstStockActivityPeriod(companyId);
      const hasStock =
        !firstStock || !suffixThreshold || suffixThreshold >= firstStock;

      const stockByCurrency: Record<string, number> = {};
      if (hasStock) {
        Object.entries(stockBase).forEach(([cur, base]) => {
          stockByCurrency[cur] = base - (suffix[cur] || 0);
        });
      }

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

async function firstStockActivityPeriod(
  companyId: string
): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ p: string | null }>>`
    SELECT MIN("period") AS p
    FROM "MonthlyFinanceSummary"
    WHERE "companyId" = ${companyId}
      AND "stockDeltaByCurrency" IS NOT NULL
      AND "stockDeltaByCurrency" <> '{}'
      AND "stockDeltaByCurrency" <> ''
  `;
  return rows[0]?.p ?? null;
}

async function baseStockByCurrency(
  companyId: string
): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<Array<{ currency: string; total: number }>>`
    SELECT "currency", COALESCE(SUM("quantity" * "unitPrice"), 0)::float8 AS total
    FROM "StockItem"
    WHERE "companyId" = ${companyId} AND "unitPrice" IS NOT NULL
    GROUP BY "currency"
  `;
  const out: Record<string, number> = {};
  rows.forEach((r) => {
    out[r.currency] = Number(r.total) || 0;
  });
  return out;
}

async function dailyTimeline(companyId: string, month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  const dayCount = new Date(y, m, 0).getDate();
  const startStr = month + "-01";
  const endStr =
    end.getFullYear() + "-" + String(end.getMonth() + 1).padStart(2, "0") + "-01";

  const periods: string[] = [];
  for (let d = 1; d <= dayCount; d++) {
    periods.push(month + "-" + String(d).padStart(2, "0"));
  }

  await ensureBackfill(companyId);
  await ensureFresh(companyId, [periodKey(new Date())]);

  const [stockBase, summaries, dailyExpense, dailyStockDelta, dailyService] =
    await Promise.all([
      baseStockByCurrency(companyId),
      prisma.monthlyFinanceSummary.findMany({
        where: { companyId, period: { gte: month } },
      }),
      prisma.$queryRaw<Array<{ day: string; currency: string; total: number }>>`
        SELECT CASE WHEN "date" ~ '^[0-9]{4}-' THEN "date"
                    ELSE to_char("createdAt", 'YYYY-MM-DD') END AS day,
               "currency",
               COALESCE(SUM("totalAmount"), 0)::float8 AS total
        FROM "Invoice"
        WHERE "companyId" = ${companyId} AND "totalAmount" IS NOT NULL
          AND (
            ("date" >= ${startStr} AND "date" < ${endStr})
            OR ("date" ~ '^[0-9]{4}-' IS NOT TRUE AND "createdAt" >= ${start} AND "createdAt" < ${end})
          )
        GROUP BY 1, 2
      `,
      prisma.$queryRaw<Array<{ day: string; currency: string; total: number }>>`
        SELECT to_char("createdAt", 'YYYY-MM-DD') AS day,
               "currency",
               COALESCE(SUM("change" * "unitPrice"), 0)::float8 AS total
        FROM "StockTransaction"
        WHERE "companyId" = ${companyId} AND "unitPrice" IS NOT NULL
          AND "createdAt" >= ${start} AND "createdAt" < ${end}
        GROUP BY 1, 2
      `,
      prisma.$queryRaw<Array<{ day: string; received: number; pending: number }>>`
        SELECT to_char("createdAt", 'YYYY-MM-DD') AS day,
               COALESCE(SUM(CASE WHEN "paid" THEN CAST("fee" AS numeric) ELSE 0 END), 0)::float8 AS received,
               COALESCE(SUM(CASE WHEN NOT "paid" THEN CAST("fee" AS numeric) ELSE 0 END), 0)::float8 AS pending
        FROM "ServiceRecord"
        WHERE "companyId" = ${companyId}
          AND "createdAt" >= ${start} AND "createdAt" < ${end}
        GROUP BY 1
      `,
    ]);

  const suffix: Record<string, number> = {};
  summaries.forEach((row: any) => {
    if (row.period <= month) return;
    const delta = parseCurrencyMap(row.stockDeltaByCurrency);
    Object.entries(delta).forEach(([cur, val]) => {
      suffix[cur] = (suffix[cur] || 0) + val;
    });
  });
  const monthRow = summaries.find((r: any) => r.period === month) as any;
  const monthDelta = parseCurrencyMap(monthRow?.stockDeltaByCurrency ?? null);

  const firstStock = await firstStockActivityPeriod(companyId);
  const hasStock = !firstStock || month >= firstStock;

  const currencies = new Set<string>([
    ...Object.keys(stockBase),
    ...dailyStockDelta.map((r) => r.currency),
    ...dailyExpense.map((r) => r.currency),
  ]);

  const dailyStockMap: Record<string, Record<string, number>> = {};
  dailyStockDelta.forEach((r) => {
    if (!dailyStockMap[r.day]) dailyStockMap[r.day] = {};
    dailyStockMap[r.day][r.currency] =
      (dailyStockMap[r.day][r.currency] || 0) + (Number(r.total) || 0);
  });
  const dailyExpenseMap: Record<string, Record<string, number>> = {};
  dailyExpense.forEach((r) => {
    if (!dailyExpenseMap[r.day]) dailyExpenseMap[r.day] = {};
    dailyExpenseMap[r.day][r.currency] =
      (dailyExpenseMap[r.day][r.currency] || 0) + (Number(r.total) || 0);
  });
  const serviceByDay: Record<string, { received: number; pending: number }> = {};
  dailyService.forEach((r) => {
    serviceByDay[r.day] = {
      received: Number(r.received) || 0,
      pending: Number(r.pending) || 0,
    };
  });

  const stockByCurrency: Record<string, number[]> = {};
  const expenseByCurrency: Record<string, number[]> = {};
  currencies.forEach((cur) => {
    const startStock = hasStock
      ? (stockBase[cur] || 0) - (suffix[cur] || 0) - (monthDelta[cur] || 0)
      : 0;
    const stockVals = new Array<number>(periods.length).fill(0);
    const expVals = new Array<number>(periods.length).fill(0);
    let cum = startStock;
    periods.forEach((p, idx) => {
      cum += (hasStock ? dailyStockMap[p]?.[cur] || 0 : 0);
      stockVals[idx] = cum;
      expVals[idx] = dailyExpenseMap[p]?.[cur] || 0;
    });
    stockByCurrency[cur] = stockVals;
    expenseByCurrency[cur] = expVals;
  });

  const received = periods.map((p) => serviceByDay[p]?.received || 0);
  const pending = periods.map((p) => serviceByDay[p]?.pending || 0);

  return { kind: "daily", periods, stockByCurrency, expenseByCurrency, received, pending };
}

async function yearlyTimeline(companyId: string, year: string) {
  const periodStart = `${year}-01`;
  const periods: string[] = [];
  for (let m = 1; m <= 12; m++) {
    periods.push(`${year}-${String(m).padStart(2, "0")}`);
  }

  await ensureBackfill(companyId);
  await ensureFresh(companyId, [periodKey(new Date())]);

  const [stockBase, summaries] = await Promise.all([
    baseStockByCurrency(companyId),
    prisma.monthlyFinanceSummary.findMany({
      where: { companyId, period: { gte: periodStart } },
    }),
  ]);

  const deltaByPeriod: Record<string, Record<string, number>> = {};
  const expenseByPeriod: Record<string, Record<string, number>> = {};
  const receivedByPeriod: Record<string, number> = {};
  const pendingByPeriod: Record<string, number> = {};
  summaries.forEach((row: any) => {
    deltaByPeriod[row.period] = parseCurrencyMap(row.stockDeltaByCurrency);
    expenseByPeriod[row.period] = parseCurrencyMap(row.expenseByCurrency);
    receivedByPeriod[row.period] = Number(row.receivedTotal) || 0;
    pendingByPeriod[row.period] = Number(row.pendingTotal) || 0;
  });

  const currencies = Array.from(
    new Set([
      ...Object.keys(stockBase),
      ...summaries.flatMap((r: any) => Object.keys(deltaByPeriod[r.period] || {})),
    ])
  );

  const firstStock = await firstStockActivityPeriod(companyId);
  const hasStock = !firstStock || `${year}-12` >= firstStock;

  const running: Record<string, number> = {};
  Object.entries(stockBase).forEach(([cur, val]) => {
    running[cur] = val;
  });
  summaries.forEach((row: any) => {
    if (row.period <= `${year}-12`) return;
    Object.entries(deltaByPeriod[row.period] || {}).forEach(([cur, val]) => {
      running[cur] = (running[cur] || 0) - val;
    });
  });

  const stockEnd: Record<string, Record<string, number>> = {};
  const lastToFirst = [...periods].sort((a, b) => (a < b ? 1 : -1));
  for (const p of lastToFirst) {
    const map: Record<string, number> = {};
    currencies.forEach((cur) => {
      map[cur] = hasStock ? running[cur] || 0 : 0;
    });
    stockEnd[p] = map;
    if (!hasStock) continue;
    Object.entries(deltaByPeriod[p] || {}).forEach(([cur, val]) => {
      running[cur] = (running[cur] || 0) - val;
    });
  }

  const stockByCurrency: Record<string, number[]> = {};
  const expenseByCurrency: Record<string, number[]> = {};
  const received: number[] = new Array(12).fill(0);
  const pending: number[] = new Array(12).fill(0);
  periods.forEach((p, idx) => {
    currencies.forEach((cur) => {
      if (!stockByCurrency[cur]) stockByCurrency[cur] = new Array<number>(12).fill(0);
      if (!expenseByCurrency[cur]) expenseByCurrency[cur] = new Array<number>(12).fill(0);
      stockByCurrency[cur][idx] = stockEnd[p]?.[cur] || 0;
      expenseByCurrency[cur][idx] = expenseByPeriod[p]?.[cur] || 0;
    });
    received[idx] = receivedByPeriod[p] || 0;
    pending[idx] = pendingByPeriod[p] || 0;
  });

  return { kind: "monthly", periods, stockByCurrency, expenseByCurrency, received, pending };
}

export async function getFinanceTimeline(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const companyId = req.user!.companyId!;

    const rawMonth = typeof req.query.month === "string" ? req.query.month : null;
    const month = rawMonth && PERIOD_RE.test(rawMonth) ? rawMonth : null;
    const rawYear = typeof req.query.year === "string" ? req.query.year : null;
    const year = rawYear && YEAR_RE.test(rawYear) ? rawYear : null;

    if (month) {
      res.json(await dailyTimeline(companyId, month));
      return;
    }
    if (year) {
      res.json(await yearlyTimeline(companyId, year));
      return;
    }

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
      baseStockByCurrency(companyId),
      prisma.monthlyFinanceSummary.findMany({
        where: { companyId, period: { in: periods } },
      }),
    ]);

    const stockBase: Record<string, number> = { ...baseStockRaw };

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
      kind: "monthly",
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
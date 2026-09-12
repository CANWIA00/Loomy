import prisma from "../prisma";

const PERIOD_PATTERN = /^\d{4}-\d{2}$/;

export function periodKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function periodFromDate(
  s: string | null | undefined,
  fallback: Date = new Date()
): string {
  if (s && s.length >= 7 && PERIOD_PATTERN.test(s.slice(0, 7))) {
    return s.slice(0, 7);
  }
  return periodKey(fallback);
}

interface MonthCurrencyRow {
  currency: string;
  total: number;
}

interface MonthServiceRow {
  received: number;
  pending: number;
  receivedCount: number;
  pendingCount: number;
}

interface MonthGroupedRow extends MonthCurrencyRow {
  period: string;
}

interface MonthGroupedServiceRow extends MonthServiceRow {
  period: string;
}

function msModel(): any {
  return (prisma as any).monthlyFinanceSummary;
}

export async function recomputeMonth(
  companyId: string,
  period: string
): Promise<void> {
  const ms = msModel();
  if (!ms) return;

  const [y, m] = period.split("-").map(Number);
  const periodStart = new Date(y, m - 1, 1);
  const periodEnd = new Date(y, m, 1);
  const periodStartStr = period + "-01";
  const periodEndDate = new Date(y, m, 1);
  const periodEndStr = `${periodEndDate.getFullYear()}-${String(periodEndDate.getMonth() + 1).padStart(2, "0")}-01`;

  const [stockRaw, expenseRaw, serviceRaw] = await Promise.all([
    prisma.$queryRaw<Array<MonthCurrencyRow>>`
      SELECT "currency", COALESCE(SUM("change" * "unitPrice"), 0)::float8 AS total
      FROM "StockTransaction"
      WHERE "companyId" = ${companyId} AND "unitPrice" IS NOT NULL
        AND "createdAt" >= ${periodStart} AND "createdAt" < ${periodEnd}
      GROUP BY "currency"
    `,
    prisma.$queryRaw<Array<MonthCurrencyRow>>`
      SELECT "currency", COALESCE(SUM("totalAmount"), 0)::float8 AS total
      FROM "Invoice"
      WHERE "companyId" = ${companyId} AND "totalAmount" IS NOT NULL
        AND (
          ("date" >= ${periodStartStr} AND "date" < ${periodEndStr})
          OR ("date" ~ '^[0-9]{4}-' IS NOT TRUE AND "createdAt" >= ${periodStart} AND "createdAt" < ${periodEnd})
        )
      GROUP BY "currency"
    `,
    prisma.$queryRaw<Array<MonthServiceRow>>`
      SELECT
        COALESCE(SUM(CASE WHEN "paid" THEN CAST("fee" AS numeric) ELSE 0 END), 0)::float8 AS received,
        COALESCE(SUM(CASE WHEN NOT "paid" THEN CAST("fee" AS numeric) ELSE 0 END), 0)::float8 AS pending,
        COUNT(*) FILTER (WHERE "paid")::int AS "receivedCount",
        COUNT(*) FILTER (WHERE NOT "paid")::int AS "pendingCount"
      FROM "ServiceRecord"
      WHERE "companyId" = ${companyId}
        AND "createdAt" >= ${periodStart} AND "createdAt" < ${periodEnd}
    `,
  ]);

  const stockDeltaByCurrency: Record<string, number> = {};
  stockRaw.forEach((r) => {
    stockDeltaByCurrency[r.currency] =
      (stockDeltaByCurrency[r.currency] || 0) + (Number(r.total) || 0);
  });

  const expenseByCurrency: Record<string, number> = {};
  expenseRaw.forEach((r) => {
    expenseByCurrency[r.currency] =
      (expenseByCurrency[r.currency] || 0) + (Number(r.total) || 0);
  });

  const svc =
    serviceRaw[0] || { received: 0, pending: 0, receivedCount: 0, pendingCount: 0 };

  await ms.upsert({
    where: { companyId_period: { companyId, period } },
    create: {
      companyId,
      period,
      stockDeltaByCurrency: JSON.stringify(stockDeltaByCurrency),
      expenseByCurrency: JSON.stringify(expenseByCurrency),
      receivedTotal: Number(svc.received) || 0,
      pendingTotal: Number(svc.pending) || 0,
      receivedCount: svc.receivedCount || 0,
      pendingCount: svc.pendingCount || 0,
    },
    update: {
      stockDeltaByCurrency: JSON.stringify(stockDeltaByCurrency),
      expenseByCurrency: JSON.stringify(expenseByCurrency),
      receivedTotal: Number(svc.received) || 0,
      pendingTotal: Number(svc.pending) || 0,
      receivedCount: svc.receivedCount || 0,
      pendingCount: svc.pendingCount || 0,
    },
  });
}

export async function scheduleRecomputeMonth(
  companyId: string,
  period: string
): Promise<void> {
  try {
    await recomputeMonth(companyId, period);
  } catch (error: any) {
    console.error("ScheduleRecomputeMonth error:", error.message);
  }
}

export async function scheduleRecomputeForRecord(
  companyId: string,
  documentDate: string | null | undefined,
  createdAt?: Date
): Promise<void> {
  await scheduleRecomputeMonth(
    companyId,
    periodFromDate(documentDate, createdAt ?? new Date())
  );
}

export async function scheduleRecomputePeriods(
  companyId: string,
  periods: string[]
): Promise<void> {
  for (const period of Array.from(new Set(periods))) {
    await scheduleRecomputeMonth(companyId, period);
  }
}

export async function backfillCompanyFinance(
  companyId: string
): Promise<void> {
  const ms = msModel();
  if (!ms) return;

  const existing = await ms.count({ where: { companyId } });
  if (existing > 0) return;

  const [stockRaw, expenseRaw, serviceRaw] = await Promise.all([
    prisma.$queryRaw<Array<MonthGroupedRow>>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS period,
             "currency",
             COALESCE(SUM("change" * "unitPrice"), 0)::float8 AS total
      FROM "StockTransaction"
      WHERE "companyId" = ${companyId} AND "unitPrice" IS NOT NULL
      GROUP BY 1, 2
    `,
    prisma.$queryRaw<Array<MonthGroupedRow>>`
      SELECT CASE WHEN "date" ~ '^[0-9]{4}-' THEN LEFT("date", 7)
                  ELSE to_char("createdAt", 'YYYY-MM') END AS period,
             "currency",
             COALESCE(SUM("totalAmount"), 0)::float8 AS total
      FROM "Invoice"
      WHERE "companyId" = ${companyId} AND "totalAmount" IS NOT NULL
      GROUP BY 1, 2
    `,
    prisma.$queryRaw<Array<MonthGroupedServiceRow>>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS period,
        COALESCE(SUM(CASE WHEN "paid" THEN CAST("fee" AS numeric) ELSE 0 END), 0)::float8 AS received,
        COALESCE(SUM(CASE WHEN NOT "paid" THEN CAST("fee" AS numeric) ELSE 0 END), 0)::float8 AS pending,
        COUNT(*) FILTER (WHERE "paid")::int AS "receivedCount",
        COUNT(*) FILTER (WHERE NOT "paid")::int AS "pendingCount"
      FROM "ServiceRecord"
      WHERE "companyId" = ${companyId}
      GROUP BY 1
    `,
  ]);

  const stockBy: Record<string, Record<string, number>> = {};
  stockRaw.forEach((r) => {
    if (!stockBy[r.period]) stockBy[r.period] = {};
    stockBy[r.period][r.currency] = (stockBy[r.period][r.currency] || 0) + (Number(r.total) || 0);
  });

  const expenseBy: Record<string, Record<string, number>> = {};
  expenseRaw.forEach((r) => {
    if (!expenseBy[r.period]) expenseBy[r.period] = {};
    expenseBy[r.period][r.currency] = (expenseBy[r.period][r.currency] || 0) + (Number(r.total) || 0);
  });

  const serviceBy: Record<string, MonthServiceRow> = {};
  serviceRaw.forEach((r) => {
    serviceBy[r.period] = {
      received: Number(r.received) || 0,
      pending: Number(r.pending) || 0,
      receivedCount: r.receivedCount || 0,
      pendingCount: r.pendingCount || 0,
    };
  });

  const periods = Array.from(
    new Set([...Object.keys(stockBy), ...Object.keys(expenseBy), ...Object.keys(serviceBy)])
  );

  if (!periods.length) return;

  await ms.createMany({
    data: periods.map((period) => {
      const svc = serviceBy[period];
      return {
        companyId,
        period,
        stockDeltaByCurrency: JSON.stringify(stockBy[period] || {}),
        expenseByCurrency: JSON.stringify(expenseBy[period] || {}),
        receivedTotal: svc?.received || 0,
        pendingTotal: svc?.pending || 0,
        receivedCount: svc?.receivedCount || 0,
        pendingCount: svc?.pendingCount || 0,
      };
    }),
  });
}

export async function ensureBackfill(companyId: string): Promise<void> {
  try {
    await backfillCompanyFinance(companyId);
  } catch (error: any) {
    console.error("EnsureBackfill error:", error.message);
  }
}

export async function backfillAllCompanies(): Promise<void> {
  try {
    const companies = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT DISTINCT "id" FROM "Company" c
      WHERE EXISTS (SELECT 1 FROM "ServiceRecord" s WHERE s."companyId" = c."id")
         OR EXISTS (SELECT 1 FROM "Invoice" i WHERE i."companyId" = c."id")
         OR EXISTS (SELECT 1 FROM "StockTransaction" t WHERE t."companyId" = c."id")
    `;
    for (const company of companies) {
      await backfillCompanyFinance(company.id);
    }
  } catch (error: any) {
    console.error("BackfillAllCompanies error:", error.message);
  }
}

export async function ensureFresh(
  companyId: string,
  periods: string[],
  maxAgeMs = 5 * 60 * 1000
): Promise<void> {
  const ms = msModel();
  if (!ms) return;
  try {
    const rows = await ms.findMany({
      where: { companyId, period: { in: periods } },
      select: { period: true, updatedAt: true },
    });
    const byPeriod: Record<string, number> = {};
    rows.forEach((r: any) => {
      byPeriod[r.period] = new Date(r.updatedAt).getTime();
    });
    for (const period of periods) {
      const age = byPeriod[period] == null ? Infinity : Date.now() - byPeriod[period];
      if (age <= maxAgeMs) continue;
      try {
        await recomputeMonth(companyId, period);
      } catch (error: any) {
        console.error("EnsureFresh recompute error:", period, error.message);
      }
    }
  } catch (error: any) {
    console.error("EnsureFresh error:", error.message);
  }
}
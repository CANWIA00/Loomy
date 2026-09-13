import prisma from "../prisma";
import { recomputeMonth } from "./monthlySummaries";

const MAX_ATTEMPTS = 8;
const LOCKED_LEASE_MS = 60 * 1000;
const DEFAULT_BATCH = 10;

let running = false;
let timer: NodeJS.Timeout | null = null;

interface ClaimedJob {
  id: number;
  companyId: string;
  period: string;
}

async function claimJobs(batchSize: number): Promise<ClaimedJob[]> {
  return prisma.$transaction(async (tx) => {
    const candidates = await tx.$queryRaw<ClaimedJob[]>`
      SELECT "id", "companyId", "period"
      FROM "FinanceRecomputeJob"
      WHERE ("lockedAt" IS NULL OR "lockedAt" < NOW() - INTERVAL '60 seconds')
        AND "attempts" < ${MAX_ATTEMPTS}
      ORDER BY "id"
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    `;
    if (!candidates.length) return [];
    await tx.financeRecomputeJob.updateMany({
      where: { id: { in: candidates.map((c) => c.id) } },
      data: { lockedAt: new Date(), attempts: { increment: 1 } },
    });
    return candidates;
  });
}

async function processBatch(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const jobs = await claimJobs(DEFAULT_BATCH);
    for (const job of jobs) {
      try {
        await recomputeMonth(job.companyId, job.period);
        await prisma.financeRecomputeJob.delete({ where: { id: job.id } });
      } catch (error: any) {
        console.error(
          "FinanceRecomputeWorker job error:",
          job.companyId,
          job.period,
          error?.message
        );
        await prisma.financeRecomputeJob.update({
          where: { id: job.id },
          data: { lockedAt: null, error: String(error?.message || "unknown") },
        });
      }
    }
  } catch (error: any) {
    console.error("FinanceRecomputeWorker batch error:", error?.message);
  } finally {
    running = false;
  }
}

export function startFinanceRecomputeWorker(pollMs = 3000): void {
  if (timer) return;
  void processBatch();
  timer = setInterval(() => {
    void processBatch();
  }, pollMs);
  if (timer && typeof timer.unref === "function") timer.unref();
}
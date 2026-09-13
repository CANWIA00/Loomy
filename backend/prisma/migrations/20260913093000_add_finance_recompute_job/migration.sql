-- CreateTable
CREATE TABLE "FinanceRecomputeJob" (
    "id" SERIAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceRecomputeJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceRecomputeJob_companyId_period_key" ON "FinanceRecomputeJob"("companyId", "period");

-- CreateIndex
CREATE INDEX "FinanceRecomputeJob_lockedAt_idx" ON "FinanceRecomputeJob"("lockedAt");
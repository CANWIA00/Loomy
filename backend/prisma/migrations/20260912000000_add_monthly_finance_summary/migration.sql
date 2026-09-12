-- CreateTable
CREATE TABLE "MonthlyFinanceSummary" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "stockDeltaByCurrency" TEXT NOT NULL DEFAULT '{}',
    "expenseByCurrency" TEXT NOT NULL DEFAULT '{}',
    "receivedTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receivedCount" INTEGER NOT NULL DEFAULT 0,
    "pendingCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyFinanceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyFinanceSummary_companyId_period_key" ON "MonthlyFinanceSummary"("companyId", "period");

-- CreateIndex
CREATE INDEX "MonthlyFinanceSummary_companyId_idx" ON "MonthlyFinanceSummary"("companyId");

-- AddForeignKey
ALTER TABLE "MonthlyFinanceSummary" ADD CONSTRAINT "MonthlyFinanceSummary_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
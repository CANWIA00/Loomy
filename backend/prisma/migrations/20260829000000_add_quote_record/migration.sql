-- CreateTable
CREATE TABLE "QuoteRecord" (
    "id" SERIAL NOT NULL,
    "documentDate" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "lines" TEXT NOT NULL DEFAULT '[]',
    "validUntil" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteRecord_companyId_idx" ON "QuoteRecord"("companyId");

-- CreateIndex
CREATE INDEX "QuoteRecord_customerId_idx" ON "QuoteRecord"("customerId");

-- AddForeignKey
ALTER TABLE "QuoteRecord" ADD CONSTRAINT "QuoteRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

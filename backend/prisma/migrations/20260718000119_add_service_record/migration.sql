-- CreateTable
CREATE TABLE "ServiceRecord" (
    "id" SERIAL NOT NULL,
    "documentDate" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerId" TEXT,
    "serviceType" TEXT NOT NULL,
    "address" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "phone" TEXT,
    "internalIp" TEXT,
    "externalIp" TEXT,
    "details" TEXT,
    "fee" TEXT NOT NULL DEFAULT '0.00',
    "technician" TEXT,
    "services" TEXT NOT NULL DEFAULT '[]',
    "technical" TEXT NOT NULL DEFAULT '[]',
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signature" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceRecord_companyId_idx" ON "ServiceRecord"("companyId");

-- CreateIndex
CREATE INDEX "ServiceRecord_customerId_idx" ON "ServiceRecord"("customerId");

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

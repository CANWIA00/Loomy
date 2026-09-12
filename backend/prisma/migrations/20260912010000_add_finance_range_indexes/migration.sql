-- CreateIndex
CREATE INDEX "ServiceRecord_companyId_createdAt_idx" ON "ServiceRecord"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "StockTransaction_companyId_createdAt_idx" ON "StockTransaction"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_companyId_createdAt_idx" ON "Invoice"("companyId", "createdAt");
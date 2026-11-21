-- Planlama isleri: atama bekleyen isler (ekip/tarih bos), teklif ve servis baglantisi.
-- Mevcut randevular SCHEDULED (planlandi) olarak isaretlenir; veri degismez.
ALTER TABLE "Appointment" ALTER COLUMN "teamName" SET DEFAULT '',
ALTER COLUMN "teamId" DROP NOT NULL,
ALTER COLUMN "date" SET DEFAULT '',
ALTER COLUMN "startTime" SET DEFAULT '',
ALTER COLUMN "duration" SET DEFAULT '',
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN "quoteId" INTEGER,
ADD COLUMN "serviceRecordId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_quoteId_key" ON "Appointment"("quoteId");
CREATE UNIQUE INDEX "Appointment_serviceRecordId_key" ON "Appointment"("serviceRecordId");
CREATE INDEX "Appointment_companyId_status_idx" ON "Appointment"("companyId", "status");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "QuoteRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "ServiceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

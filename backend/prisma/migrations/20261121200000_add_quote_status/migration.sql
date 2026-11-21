-- AlterTable: mevcut teklifler PENDING (bekliyor) olarak isaretlenir
ALTER TABLE "QuoteRecord" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "statusUpdatedAt" TIMESTAMP(3);

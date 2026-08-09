-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "paidUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "hasPaidMonthly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPaidAt" TIMESTAMP(3),
ADD COLUMN     "monthlyFee" TEXT NOT NULL DEFAULT '0.00';

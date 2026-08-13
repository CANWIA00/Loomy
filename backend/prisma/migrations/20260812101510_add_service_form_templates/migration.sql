-- AlterTable
ALTER TABLE "ServiceRecord" ADD COLUMN     "templateConfig" TEXT,
ADD COLUMN     "templateName" TEXT;

-- CreateTable
CREATE TABLE "ServiceFormTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fields" TEXT NOT NULL DEFAULT '[]',
    "chipGroups" TEXT NOT NULL DEFAULT '[]',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceFormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceFormTemplate_companyId_idx" ON "ServiceFormTemplate"("companyId");

-- AddForeignKey
ALTER TABLE "ServiceFormTemplate" ADD CONSTRAINT "ServiceFormTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

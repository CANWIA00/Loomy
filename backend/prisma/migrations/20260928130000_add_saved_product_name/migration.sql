-- CreateTable
CREATE TABLE "SavedProductName" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProductName_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedProductName_companyId_name_key" ON "SavedProductName"("companyId", "name");
CREATE INDEX "SavedProductName_companyId_name_idx" ON "SavedProductName"("companyId", "name");
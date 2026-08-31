-- AlterTable: adiciona campos de parcelamento
ALTER TABLE "Transaction" ADD COLUMN "installmentGroupId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "installmentNo" INTEGER;
ALTER TABLE "Transaction" ADD COLUMN "installmentTotal" INTEGER;

-- CreateIndex
CREATE INDEX "Transaction_installmentGroupId_idx" ON "Transaction"("installmentGroupId");

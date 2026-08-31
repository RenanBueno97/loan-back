-- AlterTable: status de pagamento (controle) por transação
ALTER TABLE "Transaction" ADD COLUMN "paid" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "store_transactions" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_transactions_store_id_created_at_idx" ON "store_transactions"("store_id", "created_at");

-- AddForeignKey
ALTER TABLE "store_transactions" ADD CONSTRAINT "store_transactions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

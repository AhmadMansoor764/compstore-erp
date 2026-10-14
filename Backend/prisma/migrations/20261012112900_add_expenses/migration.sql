-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "expense_number" VARCHAR(50) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "description" TEXT,
    "paid_by" VARCHAR(150),
    "reference" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_store_id_expense_date_idx" ON "expenses"("store_id", "expense_date");

-- CreateIndex
CREATE INDEX "expenses_store_id_status_idx" ON "expenses"("store_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_store_id_expense_number_key" ON "expenses"("store_id", "expense_number");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

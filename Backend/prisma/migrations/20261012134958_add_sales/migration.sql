-- CreateTable
CREATE TABLE "sales" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "sale_number" VARCHAR(50) NOT NULL,
    "customer_name" VARCHAR(150) NOT NULL,
    "customer_phone" VARCHAR(30),
    "sale_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "due_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "payment_method" VARCHAR(50) NOT NULL,
    "payment_status" VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
    "status" VARCHAR(20) NOT NULL DEFAULT 'Completed',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "sale_id" INTEGER NOT NULL,
    "product_id" INTEGER,
    "product_name" VARCHAR(150) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "purchase_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_store_id_sale_date_idx" ON "sales"("store_id", "sale_date");

-- CreateIndex
CREATE INDEX "sales_store_id_payment_status_idx" ON "sales"("store_id", "payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "sales_store_id_sale_number_key" ON "sales"("store_id", "sale_number");

-- CreateIndex
CREATE INDEX "sale_items_store_id_sale_id_idx" ON "sale_items"("store_id", "sale_id");

-- CreateIndex
CREATE INDEX "sale_items_product_id_idx" ON "sale_items"("product_id");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

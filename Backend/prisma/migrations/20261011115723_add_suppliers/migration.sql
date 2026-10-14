-- AlterTable
ALTER TABLE "products" ADD COLUMN     "supplier_id" INTEGER;

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "company_name" VARCHAR(150),
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_store_id_name_idx" ON "suppliers"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_id_store_id_key" ON "suppliers"("id", "store_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_store_id_fkey" FOREIGN KEY ("supplier_id", "store_id") REFERENCES "suppliers"("id", "store_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

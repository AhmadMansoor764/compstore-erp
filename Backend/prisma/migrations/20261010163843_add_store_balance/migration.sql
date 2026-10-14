-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "balance" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- RenameForeignKey
ALTER TABLE "stores" RENAME CONSTRAINT "stores_owner_id_fkey" TO "store_owner_id_fkey";

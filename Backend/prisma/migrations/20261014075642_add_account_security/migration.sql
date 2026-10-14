/*
  Warnings:

  - A unique constraint covering the columns `[pending_email]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "members" ADD COLUMN     "pending_email" VARCHAR(255),
ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "auth_verification_codes" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_verification_codes_member_id_purpose_idx" ON "auth_verification_codes"("member_id", "purpose");

-- CreateIndex
CREATE INDEX "auth_verification_codes_expires_at_idx" ON "auth_verification_codes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "members_pending_email_key" ON "members"("pending_email");

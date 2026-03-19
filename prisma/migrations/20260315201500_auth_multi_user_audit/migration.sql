-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- Ensure migration owner exists for existing records
INSERT INTO "public"."User" ("id", "name", "email", "password", "createdAt", "updatedAt")
VALUES (
  'system-migration-user',
  'System Migration User',
  'system-migration-user@local.invalid',
  '$2b$12$uJ7cSnVQxNqctEsiiNgNpu5eW2g8QnNB9wN8I2mMEyVnCvib/57q2',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO NOTHING;

-- AlterTable
ALTER TABLE "public"."Dealer"
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows
UPDATE "public"."Dealer"
SET "createdById" = 'system-migration-user'
WHERE "createdById" IS NULL;

-- Enforce non-null owner
ALTER TABLE "public"."Dealer"
ALTER COLUMN "createdById" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_createdById_contactPhone_key" ON "public"."Dealer"("createdById", "contactPhone");

-- AddForeignKey
ALTER TABLE "public"."Dealer"
ADD CONSTRAINT "Dealer_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

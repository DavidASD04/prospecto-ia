/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `MessageTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Dealer_createdById_phone_key";

-- DropIndex
DROP INDEX "MessageTemplate_createdById_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_name_key" ON "MessageTemplate"("name");

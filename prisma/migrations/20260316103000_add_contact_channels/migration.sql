ALTER TABLE "Dealer"
RENAME COLUMN "contactPhone" TO "phone";

ALTER INDEX IF EXISTS "Dealer_contactPhone_key"
RENAME TO "Dealer_phone_key";

ALTER INDEX IF EXISTS "Dealer_createdById_contactPhone_key"
RENAME TO "Dealer_createdById_phone_key";

ALTER TABLE "Dealer"
ADD COLUMN "whatsapp_phone" TEXT,
ADD COLUMN "instagram" TEXT,
ADD COLUMN "contact_method" TEXT NOT NULL DEFAULT 'none';

UPDATE "Dealer"
SET
	"whatsapp_phone" = "phone",
	"contact_method" = 'whatsapp';

CREATE UNIQUE INDEX IF NOT EXISTS "Dealer_phone_key" ON "Dealer"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "Dealer_whatsapp_phone_key" ON "Dealer"("whatsapp_phone");
CREATE UNIQUE INDEX IF NOT EXISTS "Dealer_instagram_key" ON "Dealer"("instagram");

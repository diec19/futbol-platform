-- Remove legacy Evolution API WhatsApp config fields from clubs
ALTER TABLE "clubs" DROP COLUMN IF EXISTS "whatsappApiUrl";
ALTER TABLE "clubs" DROP COLUMN IF EXISTS "whatsappApiKey";
ALTER TABLE "clubs" DROP COLUMN IF EXISTS "whatsappInstance";

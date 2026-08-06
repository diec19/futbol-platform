-- DropIndex
DROP INDEX "notification_outbox_channel_refType_entityId_key";

-- AlterTable
ALTER TABLE "notification_outbox" ADD COLUMN     "recipientKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "notification_outbox_channel_refType_entityId_recipientKey_key" ON "notification_outbox"("channel", "refType", "entityId", "recipientKey");

-- AlterTable
ALTER TABLE "SMS" ADD COLUMN "recipient_id" INTEGER;
ALTER TABLE "SMS" ADD COLUMN "milk_request_id" INTEGER;
ALTER TABLE "SMS" ADD COLUMN "phone_number" TEXT;
ALTER TABLE "SMS" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "SMS" ADD COLUMN "notification_type" TEXT;
ALTER TABLE "SMS" ADD COLUMN "error_message" TEXT;

-- CreateIndex
CREATE INDEX "SMS_milk_request_id_provider_notification_type_status_idx" ON "SMS"("milk_request_id", "provider", "notification_type", "status");

-- CreateIndex
CREATE INDEX "SMS_recipient_id_idx" ON "SMS"("recipient_id");

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "Recipient"("recipient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_milk_request_id_fkey" FOREIGN KEY ("milk_request_id") REFERENCES "MilkRequest"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;

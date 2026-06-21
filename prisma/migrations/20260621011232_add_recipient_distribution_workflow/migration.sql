-- CreateEnum
CREATE TYPE "MilkRequestStatus" AS ENUM ('DRAFT', 'INCOMPLETE', 'QUEUED', 'READY_FOR_RELEASE', 'PARTIALLY_FULFILLED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MilkRequestPriority" AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "MilkRequestPaymentStatus" AS ENUM ('NOT_REQUIRED', 'UNPAID', 'PARTIAL', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "MilkRequestNotificationStatus" AS ENUM ('NOT_READY', 'READY_FOR_PICKUP', 'STAFF_NOTED', 'MANUALLY_NOTIFIED');

-- AlterTable
ALTER TABLE "Beneficiary" ADD COLUMN     "birth_weight" TEXT,
ADD COLUMN     "birthdate" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gestational_age" TEXT,
ADD COLUMN     "medical_condition" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "recipient_id" INTEGER,
ADD COLUMN     "sex" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Dispensing" ADD COLUMN     "amount_paid" DOUBLE PRECISION,
ADD COLUMN     "milk_request_id" INTEGER,
ADD COLUMN     "payment_status" "MilkRequestPaymentStatus",
ADD COLUMN     "source_summary" TEXT;

-- CreateTable
CREATE TABLE "Recipient" (
    "recipient_id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "contact_no" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "relationship_to_beneficiary" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipient_pkey" PRIMARY KEY ("recipient_id")
);

-- CreateTable
CREATE TABLE "MilkRequest" (
    "request_id" SERIAL NOT NULL,
    "request_no" TEXT NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "beneficiary_id" INTEGER NOT NULL,
    "status" "MilkRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "MilkRequestPriority" NOT NULL DEFAULT 'NORMAL',
    "requested_volume" DOUBLE PRECISION NOT NULL,
    "allocated_volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "released_volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "needed_by" TIMESTAMP(3),
    "payment_status" "MilkRequestPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "deposit_amount" DOUBLE PRECISION,
    "price_per_ml" DOUBLE PRECISION,
    "total_amount" DOUBLE PRECISION,
    "amount_paid" DOUBLE PRECISION,
    "payment_notes" TEXT,
    "notification_status" "MilkRequestNotificationStatus" NOT NULL DEFAULT 'NOT_READY',
    "profile_complete" BOOLEAN NOT NULL DEFAULT false,
    "beneficiary_complete" BOOLEAN NOT NULL DEFAULT false,
    "reason_provided" BOOLEAN NOT NULL DEFAULT false,
    "volume_entered" BOOLEAN NOT NULL DEFAULT false,
    "staff_approved" BOOLEAN NOT NULL DEFAULT false,
    "payment_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "cancellation_reason" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "released_by" INTEGER,
    "released_at" TIMESTAMP(3),

    CONSTRAINT "MilkRequest_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "MilkRequestAllocation" (
    "allocation_id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "released_volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ALLOCATED',
    "allocated_by" INTEGER NOT NULL,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),

    CONSTRAINT "MilkRequestAllocation_pkey" PRIMARY KEY ("allocation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MilkRequest_request_no_key" ON "MilkRequest"("request_no");

-- CreateIndex
CREATE INDEX "MilkRequest_recipient_id_idx" ON "MilkRequest"("recipient_id");

-- CreateIndex
CREATE INDEX "MilkRequest_beneficiary_id_idx" ON "MilkRequest"("beneficiary_id");

-- CreateIndex
CREATE INDEX "MilkRequest_status_priority_created_at_idx" ON "MilkRequest"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "MilkRequest_payment_status_idx" ON "MilkRequest"("payment_status");

-- CreateIndex
CREATE INDEX "MilkRequestAllocation_batch_id_idx" ON "MilkRequestAllocation"("batch_id");

-- CreateIndex
CREATE INDEX "MilkRequestAllocation_status_idx" ON "MilkRequestAllocation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MilkRequestAllocation_request_id_batch_id_key" ON "MilkRequestAllocation"("request_id", "batch_id");

-- CreateIndex
CREATE INDEX "Beneficiary_recipient_id_idx" ON "Beneficiary"("recipient_id");

-- CreateIndex
CREATE INDEX "Dispensing_milk_request_id_idx" ON "Dispensing"("milk_request_id");

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "Recipient"("recipient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRequest" ADD CONSTRAINT "MilkRequest_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "Recipient"("recipient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRequest" ADD CONSTRAINT "MilkRequest_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "Beneficiary"("beneficiary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRequest" ADD CONSTRAINT "MilkRequest_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRequest" ADD CONSTRAINT "MilkRequest_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRequestAllocation" ADD CONSTRAINT "MilkRequestAllocation_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "MilkRequest"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRequestAllocation" ADD CONSTRAINT "MilkRequestAllocation_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch"("batch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRequestAllocation" ADD CONSTRAINT "MilkRequestAllocation_allocated_by_fkey" FOREIGN KEY ("allocated_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispensing" ADD CONSTRAINT "Dispensing_milk_request_id_fkey" FOREIGN KEY ("milk_request_id") REFERENCES "MilkRequest"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;

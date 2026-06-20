-- CreateEnum
CREATE TYPE "EligibilityResult" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "SupsupTodoWorkflowStatus" AS ENUM (
    'IN_PROGRESS',
    'WAITING_PRE_LAB_RESULT',
    'PRE_LAB_FAILED',
    'READY_FOR_PASTEURIZATION',
    'WAITING_POST_LAB_RESULT',
    'POST_LAB_FAILED',
    'READY_FOR_STORAGE',
    'READY_FOR_DISPENSING',
    'DISPOSED'
);

-- CreateEnum
CREATE TYPE "SupsupTodoWorkflowStep" AS ENUM (
    'LACTATION_EXTRACTION',
    'BOTTLING_LABELING',
    'COLD_CHAIN',
    'PRE_IN_COLLECTION',
    'PRE_SENT_TO_LAB',
    'PRE_LAB_RESULT',
    'PASTEURIZATION',
    'POST_SENT_TO_LAB',
    'POST_LAB_RESULT',
    'COMPLETED',
    'DISPOSED'
);

-- CreateTable
CREATE TABLE "DonorEligibility" (
    "eligibility_id" SERIAL NOT NULL,
    "donor_id" INTEGER NOT NULL,
    "screening_result" "EligibilityResult",
    "screening_date" TIMESTAMP(3),
    "consent_signed" BOOLEAN NOT NULL DEFAULT false,
    "consent_date" TIMESTAMP(3),
    "staff_notes" TEXT,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorEligibility_pkey" PRIMARY KEY ("eligibility_id")
);

-- CreateTable
CREATE TABLE "SupsupTodoDonationWorkflow" (
    "workflow_id" SERIAL NOT NULL,
    "donor_id" INTEGER NOT NULL,
    "ctn" INTEGER,
    "batch_id" INTEGER,
    "final_status" "SupsupTodoWorkflowStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "current_step" "SupsupTodoWorkflowStep" NOT NULL DEFAULT 'LACTATION_EXTRACTION',
    "extraction_completed_at" TIMESTAMP(3),
    "extracted_volume" DOUBLE PRECISION,
    "extraction_notes" TEXT,
    "bottling_completed_at" TIMESTAMP(3),
    "bottle_no" TEXT,
    "label_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "bottling_notes" TEXT,
    "cold_chain_started_at" TIMESTAMP(3),
    "placed_in_cooler" BOOLEAN NOT NULL DEFAULT false,
    "cold_chain_notes" TEXT,
    "pre_collection_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "pre_sample_volume" DOUBLE PRECISION,
    "pre_in_collection_notes" TEXT,
    "pre_sent_to_lab" BOOLEAN NOT NULL DEFAULT false,
    "pre_sample_sent_at" TIMESTAMP(3),
    "pre_expected_result_date" TIMESTAMP(3),
    "pre_sent_notes" TEXT,
    "pre_lab_result" "LabTestResult",
    "pre_lab_received_at" TIMESTAMP(3),
    "pre_lab_notes" TEXT,
    "pasteurization_completed_at" TIMESTAMP(3),
    "pasteurization_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "pasteurization_notes" TEXT,
    "post_sample_volume" DOUBLE PRECISION,
    "post_sent_to_lab" BOOLEAN NOT NULL DEFAULT false,
    "post_sample_sent_at" TIMESTAMP(3),
    "post_expected_result_date" TIMESTAMP(3),
    "post_sent_notes" TEXT,
    "post_lab_result" "LabTestResult",
    "post_lab_received_at" TIMESTAMP(3),
    "post_lab_notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupsupTodoDonationWorkflow_pkey" PRIMARY KEY ("workflow_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonorEligibility_donor_id_key" ON "DonorEligibility"("donor_id");

-- CreateIndex
CREATE UNIQUE INDEX "SupsupTodoDonationWorkflow_ctn_key" ON "SupsupTodoDonationWorkflow"("ctn");

-- CreateIndex
CREATE UNIQUE INDEX "SupsupTodoDonationWorkflow_batch_id_key" ON "SupsupTodoDonationWorkflow"("batch_id");

-- CreateIndex
CREATE INDEX "SupsupTodoDonationWorkflow_donor_id_idx" ON "SupsupTodoDonationWorkflow"("donor_id");

-- AddForeignKey
ALTER TABLE "DonorEligibility" ADD CONSTRAINT "DonorEligibility_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "Donor"("donor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorEligibility" ADD CONSTRAINT "DonorEligibility_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupsupTodoDonationWorkflow" ADD CONSTRAINT "SupsupTodoDonationWorkflow_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "Donor"("donor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupsupTodoDonationWorkflow" ADD CONSTRAINT "SupsupTodoDonationWorkflow_ctn_fkey" FOREIGN KEY ("ctn") REFERENCES "Collection"("ctn") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupsupTodoDonationWorkflow" ADD CONSTRAINT "SupsupTodoDonationWorkflow_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch"("batch_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupsupTodoDonationWorkflow" ADD CONSTRAINT "SupsupTodoDonationWorkflow_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupsupTodoDonationWorkflow" ADD CONSTRAINT "SupsupTodoDonationWorkflow_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

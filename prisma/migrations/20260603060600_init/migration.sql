-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'DONOR');

-- CreateEnum
CREATE TYPE "DonorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Program" AS ENUM ('SUPSUP_TODO', 'MILKY_WAY', 'MOMS_ACT');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('POOLING', 'TESTING', 'PASTEURIZED', 'AVAILABLE', 'DISPENSED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "LabStage" AS ENUM ('PRE_PASTEURIZATION', 'POST_PASTEURIZATION');

-- CreateEnum
CREATE TYPE "LabTestResult" AS ENUM ('PASS', 'FAIL', 'PENDING');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "auth_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STAFF',

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "donor_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "contact_no" TEXT NOT NULL,
    "civil_status" TEXT NOT NULL,
    "status" "DonorStatus" NOT NULL DEFAULT 'ACTIVE',
    "registration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("donor_id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "beneficiary_id" SERIAL NOT NULL,
    "contact_no" TEXT NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("beneficiary_id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "ctn" SERIAL NOT NULL,
    "donor_id" INTEGER NOT NULL,
    "recorded_by" INTEGER NOT NULL,
    "program" "Program" NOT NULL,
    "collection_date" TIMESTAMP(3) NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "batch_id" INTEGER,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("ctn")
);

-- CreateTable
CREATE TABLE "Batch" (
    "batch_id" SERIAL NOT NULL,
    "batch_code" TEXT NOT NULL,
    "pooling_date" TIMESTAMP(3) NOT NULL,
    "total_volume" DOUBLE PRECISION NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'POOLING',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("batch_id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "lab_id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "stage" "LabStage" NOT NULL,
    "test_date" TIMESTAMP(3) NOT NULL,
    "result" "LabTestResult" NOT NULL DEFAULT 'PENDING',
    "tested_by" INTEGER NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("lab_id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "inv_id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "donated_vol" DOUBLE PRECISION NOT NULL,
    "pasteurized_vol" DOUBLE PRECISION NOT NULL,
    "available_vol" DOUBLE PRECISION NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("inv_id")
);

-- CreateTable
CREATE TABLE "Dispensing" (
    "dis_id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "beneficiary_id" INTEGER NOT NULL,
    "dispensed_by" INTEGER NOT NULL,
    "dispensing_date" TIMESTAMP(3) NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "Dispensing_pkey" PRIMARY KEY ("dis_id")
);

-- CreateTable
CREATE TABLE "Disposal" (
    "disposal_id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "disposal_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "disposed_by" INTEGER NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "Disposal_pkey" PRIMARY KEY ("disposal_id")
);

-- CreateTable
CREATE TABLE "SMS" (
    "sms_id" SERIAL NOT NULL,
    "beneficiary_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "retry" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SMS_pkey" PRIMARY KEY ("sms_id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action_details" TEXT NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_auth_id_key" ON "User"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batch_code_key" ON "Batch"("batch_code");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_batch_id_key" ON "Inventory"("batch_id");

-- AddForeignKey
ALTER TABLE "Donor" ADD CONSTRAINT "Donor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "Donor"("donor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch"("batch_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch"("batch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_tested_by_fkey" FOREIGN KEY ("tested_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch"("batch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispensing" ADD CONSTRAINT "Dispensing_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch"("batch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispensing" ADD CONSTRAINT "Dispensing_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "Beneficiary"("beneficiary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispensing" ADD CONSTRAINT "Dispensing_dispensed_by_fkey" FOREIGN KEY ("dispensed_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposal" ADD CONSTRAINT "Disposal_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch"("batch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposal" ADD CONSTRAINT "Disposal_disposed_by_fkey" FOREIGN KEY ("disposed_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "Beneficiary"("beneficiary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

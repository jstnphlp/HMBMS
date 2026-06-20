ALTER TABLE "Donor"
ADD COLUMN "pregnancy_delivery_details" TEXT,
ADD COLUMN "infant_details" TEXT;

ALTER TABLE "Batch"
ADD COLUMN "remaining_volume" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Batch"
SET "remaining_volume" = "total_volume";

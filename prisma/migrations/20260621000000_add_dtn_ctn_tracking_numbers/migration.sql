ALTER TABLE "Collection"
ADD COLUMN "tracking_no" TEXT;

ALTER TABLE "SupsupTodoDonationWorkflow"
ADD COLUMN "tracking_no" TEXT,
ADD COLUMN "sample_sequence" INTEGER;

WITH ordered_workflows AS (
  SELECT
    "workflow_id",
    "donor_id",
    ROW_NUMBER() OVER (
      PARTITION BY "donor_id"
      ORDER BY "created_at" ASC, "workflow_id" ASC
    ) AS sequence_no
  FROM "SupsupTodoDonationWorkflow"
)
UPDATE "SupsupTodoDonationWorkflow" workflow
SET
  "sample_sequence" = ordered.sequence_no,
  "tracking_no" = 'CTN-' || LPAD(ordered."donor_id"::TEXT, 4, '0') || '-' || LPAD(ordered.sequence_no::TEXT, 3, '0')
FROM ordered_workflows ordered
WHERE workflow."workflow_id" = ordered."workflow_id";

UPDATE "Collection" collection
SET "tracking_no" = workflow."tracking_no"
FROM "SupsupTodoDonationWorkflow" workflow
WHERE collection."ctn" = workflow."ctn";

WITH workflow_max AS (
  SELECT "donor_id", COALESCE(MAX("sample_sequence"), 0) AS max_sequence
  FROM "SupsupTodoDonationWorkflow"
  GROUP BY "donor_id"
),
ordered_collections AS (
  SELECT
    collection."ctn",
    collection."donor_id",
    COALESCE(workflow_max.max_sequence, 0) + ROW_NUMBER() OVER (
      PARTITION BY collection."donor_id"
      ORDER BY collection."collection_date" ASC, collection."ctn" ASC
    ) AS sequence_no
  FROM "Collection" collection
  LEFT JOIN workflow_max ON workflow_max."donor_id" = collection."donor_id"
  WHERE collection."tracking_no" IS NULL
)
UPDATE "Collection" collection
SET "tracking_no" = 'CTN-' || LPAD(ordered."donor_id"::TEXT, 4, '0') || '-' || LPAD(ordered.sequence_no::TEXT, 3, '0')
FROM ordered_collections ordered
WHERE collection."ctn" = ordered."ctn";

ALTER TABLE "SupsupTodoDonationWorkflow"
ALTER COLUMN "tracking_no" SET NOT NULL,
ALTER COLUMN "sample_sequence" SET NOT NULL;

CREATE UNIQUE INDEX "Collection_tracking_no_key" ON "Collection"("tracking_no");
CREATE UNIQUE INDEX "SupsupTodoDonationWorkflow_tracking_no_key" ON "SupsupTodoDonationWorkflow"("tracking_no");
CREATE UNIQUE INDEX "SupsupTodoDonationWorkflow_donor_id_sample_sequence_key" ON "SupsupTodoDonationWorkflow"("donor_id", "sample_sequence");

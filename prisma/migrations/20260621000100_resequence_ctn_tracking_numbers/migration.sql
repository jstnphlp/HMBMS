UPDATE "SupsupTodoDonationWorkflow"
SET "tracking_no" = 'TMP-WF-' || "workflow_id"::TEXT;

UPDATE "Collection"
SET "tracking_no" = 'TMP-COL-' || "ctn"::TEXT
WHERE "tracking_no" IS NOT NULL;

WITH all_samples AS (
  SELECT
    workflow."donor_id",
    workflow."workflow_id",
    workflow."ctn",
    NULL::INTEGER AS standalone_ctn,
    workflow."created_at" AS sample_date,
    workflow."workflow_id" AS stable_id
  FROM "SupsupTodoDonationWorkflow" workflow

  UNION ALL

  SELECT
    collection."donor_id",
    NULL::INTEGER AS workflow_id,
    NULL::INTEGER AS ctn,
    collection."ctn" AS standalone_ctn,
    collection."collection_date" AS sample_date,
    collection."ctn" AS stable_id
  FROM "Collection" collection
  LEFT JOIN "SupsupTodoDonationWorkflow" workflow
    ON workflow."ctn" = collection."ctn"
  WHERE workflow."workflow_id" IS NULL
),
ranked_samples AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY "donor_id"
      ORDER BY sample_date ASC, stable_id ASC
    ) AS sequence_no
  FROM all_samples
)
UPDATE "SupsupTodoDonationWorkflow" workflow
SET
  "sample_sequence" = ranked.sequence_no,
  "tracking_no" = 'CTN-' || LPAD(ranked."donor_id"::TEXT, 4, '0') || '-' || LPAD(ranked.sequence_no::TEXT, 3, '0')
FROM ranked_samples ranked
WHERE workflow."workflow_id" = ranked."workflow_id";

UPDATE "Collection" collection
SET "tracking_no" = workflow."tracking_no"
FROM "SupsupTodoDonationWorkflow" workflow
WHERE collection."ctn" = workflow."ctn";

WITH all_samples AS (
  SELECT
    workflow."donor_id",
    workflow."workflow_id",
    workflow."ctn",
    NULL::INTEGER AS standalone_ctn,
    workflow."created_at" AS sample_date,
    workflow."workflow_id" AS stable_id
  FROM "SupsupTodoDonationWorkflow" workflow

  UNION ALL

  SELECT
    collection."donor_id",
    NULL::INTEGER AS workflow_id,
    NULL::INTEGER AS ctn,
    collection."ctn" AS standalone_ctn,
    collection."collection_date" AS sample_date,
    collection."ctn" AS stable_id
  FROM "Collection" collection
  LEFT JOIN "SupsupTodoDonationWorkflow" workflow
    ON workflow."ctn" = collection."ctn"
  WHERE workflow."workflow_id" IS NULL
),
ranked_samples AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY "donor_id"
      ORDER BY sample_date ASC, stable_id ASC
    ) AS sequence_no
  FROM all_samples
)
UPDATE "Collection" collection
SET "tracking_no" = 'CTN-' || LPAD(ranked."donor_id"::TEXT, 4, '0') || '-' || LPAD(ranked.sequence_no::TEXT, 3, '0')
FROM ranked_samples ranked
WHERE collection."ctn" = ranked.standalone_ctn;

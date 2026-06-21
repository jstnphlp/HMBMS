-- CreateEnum
CREATE TYPE "CollectionBatchType" AS ENUM ('PRE_PSTR', 'PSTR', 'POST_PSTR');

-- CreateEnum
CREATE TYPE "CollectionBatchStatus" AS ENUM ('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CollectionBatch" (
    "id" SERIAL NOT NULL,
    "batch_no" TEXT NOT NULL,
    "batch_type" "CollectionBatchType" NOT NULL,
    "status" "CollectionBatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "CollectionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionBatchItem" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "workflow_id" INTEGER,
    "ctn" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionBatch_batch_no_key" ON "CollectionBatch"("batch_no");

-- CreateIndex
CREATE INDEX "CollectionBatch_batch_type_status_idx" ON "CollectionBatch"("batch_type", "status");

-- CreateIndex
CREATE INDEX "CollectionBatchItem_collection_id_idx" ON "CollectionBatchItem"("collection_id");

-- CreateIndex
CREATE INDEX "CollectionBatchItem_workflow_id_idx" ON "CollectionBatchItem"("workflow_id");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionBatchItem_batch_id_collection_id_key" ON "CollectionBatchItem"("batch_id", "collection_id");

-- AddForeignKey
ALTER TABLE "CollectionBatch" ADD CONSTRAINT "CollectionBatch_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionBatchItem" ADD CONSTRAINT "CollectionBatchItem_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "CollectionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionBatchItem" ADD CONSTRAINT "CollectionBatchItem_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "Collection"("ctn") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionBatchItem" ADD CONSTRAINT "CollectionBatchItem_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "SupsupTodoDonationWorkflow"("workflow_id") ON DELETE SET NULL ON UPDATE CASCADE;

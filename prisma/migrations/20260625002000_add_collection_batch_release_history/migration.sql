-- AlterTable
ALTER TABLE "CollectionBatchItem"
ADD COLUMN "item_status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "release_result" TEXT,
ADD COLUMN "release_destination" TEXT,
ADD COLUMN "released_at" TIMESTAMP(3),
ADD COLUMN "released_by" INTEGER;

-- CreateIndex
CREATE INDEX "CollectionBatchItem_batch_id_item_status_idx" ON "CollectionBatchItem"("batch_id", "item_status");

-- CreateIndex
CREATE INDEX "CollectionBatchItem_released_by_idx" ON "CollectionBatchItem"("released_by");

-- AddForeignKey
ALTER TABLE "CollectionBatchItem" ADD CONSTRAINT "CollectionBatchItem_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

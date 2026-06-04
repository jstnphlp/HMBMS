"use client";

import { useState } from "react";
import { BatchTable } from "./batch-table";
import { BatchDetailPanel } from "./batch-detail-panel";
import type { LabBatchSummary, LabBatchDetail } from "../queries";

interface LaboratoryViewProps {
  batches: LabBatchSummary[];
  initialBatchDetail: LabBatchDetail | null;
}

export function LaboratoryView({
  batches,
  initialBatchDetail,
}: LaboratoryViewProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(
    initialBatchDetail?.batch_id ?? null
  );
  const [batchDetail, setBatchDetail] = useState<LabBatchDetail | null>(
    initialBatchDetail
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  async function handleSelectBatch(batchId: number) {
    if (batchId === selectedBatchId) return;

    setSelectedBatchId(batchId);
    setIsLoadingDetail(true);

    try {
      const { getBatchLabDetail } = await import("../queries");
      const detail = await getBatchLabDetail(batchId);
      setBatchDetail(detail);
    } catch {
      setBatchDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function handleCloseDetail() {
    setSelectedBatchId(null);
    setBatchDetail(null);
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
      <BatchTable
        batches={batches}
        selectedBatchId={selectedBatchId}
        onSelectBatch={handleSelectBatch}
      />
      {isLoadingDetail ? (
        <div className="lg:col-span-1 bg-background border border-border rounded-lg flex flex-col items-center justify-center p-8">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground mt-3">
            Loading batch details...
          </p>
        </div>
      ) : (
        <BatchDetailPanel
          batch={batchDetail}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

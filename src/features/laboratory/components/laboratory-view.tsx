"use client";

import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/core/ui/tabs";
import { Badge } from "@/core/ui/badge";
import { BatchTable } from "./batch-table";
import { BatchDetailPanel } from "./batch-detail-panel";
import type { LabBatchSummary, LabBatchDetail } from "../queries";

interface LaboratoryViewProps {
  batches: LabBatchSummary[];
  initialBatchDetail: LabBatchDetail | null;
}

type StatusTab = "all" | "pending" | "review" | "passed" | "failed";

const STATUS_TAB_MAP: Record<StatusTab, string[]> = {
  all: [],
  pending: ["POOLING"],
  review: ["TESTING"],
  passed: ["PASTEURIZED", "AVAILABLE"],
  failed: ["DISPOSED"],
};

export function LaboratoryView({
  batches,
  initialBatchDetail,
}: LaboratoryViewProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(
    initialBatchDetail?.batch_id ?? null
  );
  const [batchDetail, setBatchDetail] = useState<LabBatchDetail | null>(
    initialBatchDetail
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const filteredBatches = useMemo(() => {
    const allowedStatuses = STATUS_TAB_MAP[activeTab];
    if (allowedStatuses.length === 0) return batches;
    return batches.filter((b) => allowedStatuses.includes(b.status));
  }, [batches, activeTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<StatusTab, number> = {
      all: batches.length,
      pending: 0,
      review: 0,
      passed: 0,
      failed: 0,
    };
    for (const batch of batches) {
      if (batch.status === "POOLING") counts.pending++;
      if (batch.status === "TESTING") counts.review++;
      if (batch.status === "PASTEURIZED" || batch.status === "AVAILABLE")
        counts.passed++;
      if (batch.status === "DISPOSED") counts.failed++;
    }
    return counts;
  }, [batches]);

  const selectedBatchSummaries = useMemo(() => {
    return batches.filter((b) => selectedIds.has(b.batch_id));
  }, [batches, selectedIds]);

  const handleSelectionChange = useCallback((ids: Set<number>) => {
    setSelectedIds(ids);
  }, []);

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

  function handleClearSelection() {
    setSelectedIds(new Set());
  }

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as StatusTab)}
      >
        <TabsList variant="line" className="gap-1">
          <TabsTrigger value="all" className="text-xs px-3">
            All
            <Badge className="ml-1 bg-muted text-muted-foreground px-1.5 py-0 text-[10px]">
              {tabCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs px-3">
            Pending Tests
            <Badge className="ml-1 bg-muted text-muted-foreground px-1.5 py-0 text-[10px]">
              {tabCounts.pending}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="review" className="text-xs px-3">
            Under Review
            <Badge className="ml-1 bg-muted text-muted-foreground px-1.5 py-0 text-[10px]">
              {tabCounts.review}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="passed" className="text-xs px-3">
            Passed
            <Badge className="ml-1 bg-primary/10 text-primary px-1.5 py-0 text-[10px]">
              {tabCounts.passed}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="failed" className="text-xs px-3">
            Failed
            <Badge className="ml-1 bg-destructive/10 text-destructive px-1.5 py-0 text-[10px]">
              {tabCounts.failed}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-4 overflow-hidden">
        <BatchTable
          batches={filteredBatches}
          selectedBatchId={selectedBatchId}
          onSelectBatch={handleSelectBatch}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
        {isLoadingDetail ? (
          <div className="bg-background border border-border rounded-lg flex flex-col items-center justify-center p-8">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground mt-3">
              Loading batch details...
            </p>
          </div>
        ) : (
          <BatchDetailPanel
            batch={batchDetail}
            selectedBatchIds={selectedIds}
            selectedBatchSummaries={selectedBatchSummaries}
            onClose={handleCloseDetail}
            onClearSelection={handleClearSelection}
          />
        )}
      </div>
    </div>
  );
}

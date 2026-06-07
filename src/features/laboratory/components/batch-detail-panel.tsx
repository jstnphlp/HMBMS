"use client";

import { useState } from "react";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { Textarea } from "@/core/ui/textarea";
import { Separator } from "@/core/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import { BatchStatusBadge } from "./batch-status-badge";
import { LabResultBadge } from "./lab-result-badge";
import { cn } from "@/core/utils/cn";
import {
  recordLabResult,
  updateBatchLabResults,
  bulkUpdateBatchStatus,
} from "../actions";
import { toast } from "sonner";
import {
  FlaskConical,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Beaker,
  Loader2,
  ArrowRight,
  Layers,
} from "lucide-react";
import type { LabBatchDetail, LabBatchSummary } from "../queries";

interface BatchDetailPanelProps {
  batch: LabBatchDetail | null;
  selectedBatchIds: Set<number>;
  selectedBatchSummaries: LabBatchSummary[];
  onClose: () => void;
  onClearSelection: () => void;
}

const STATUS_TRANSITIONS: Record<
  string,
  { value: string; label: string }[]
> = {
  POOLING: [{ value: "TESTING", label: "Move to Testing" }],
  TESTING: [
    { value: "PASTEURIZED", label: "Mark Pasteurized" },
    { value: "DISPOSED", label: "Dispose (Failed)" },
  ],
  PASTEURIZED: [
    { value: "AVAILABLE", label: "Mark Available" },
    { value: "DISPOSED", label: "Dispose (Failed)" },
  ],
  AVAILABLE: [{ value: "DISPOSED", label: "Dispose" }],
};

const BULK_STATUS_OPTIONS = [
  { value: "TESTING", label: "Testing" },
  { value: "PASTEURIZED", label: "Pasteurized" },
  { value: "AVAILABLE", label: "Available" },
  { value: "DISPOSED", label: "Disposed" },
];

export function BatchDetailPanel({
  batch,
  selectedBatchIds,
  selectedBatchSummaries,
  onClose,
  onClearSelection,
}: BatchDetailPanelProps) {
  if (selectedBatchIds.size > 1) {
    return (
      <BulkEditPanel
        selectedBatchSummaries={selectedBatchSummaries}
        onClearSelection={onClearSelection}
      />
    );
  }

  return (
    <SingleBatchPanel
      key={batch?.batch_id}
      batch={batch}
      onClose={onClose}
    />
  );
}

function BulkEditPanel({
  selectedBatchSummaries,
  onClearSelection,
}: {
  selectedBatchSummaries: LabBatchSummary[];
  onClearSelection: () => void;
}) {
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkNotes, setBulkNotes] = useState("");
  const [activeStage, setActiveStage] = useState<
    "PRE_PASTEURIZATION" | "POST_PASTEURIZATION"
  >("PRE_PASTEURIZATION");
  const [colonyCount, setColonyCount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAnyBulkField =
    !!bulkStatus || !!bulkNotes.trim() || colonyCount !== "";

  async function handleBulkSave() {
    if (!hasAnyBulkField) {
      toast.error("Fill in at least one field before saving.");
      return;
    }

    setIsSubmitting(true);

    const colonyCountNum =
      colonyCount !== "" ? Number(colonyCount) : undefined;

    const response = await bulkUpdateBatchStatus({
      batch_ids: selectedBatchSummaries.map((b) => b.batch_id),
      status: bulkStatus
        ? (bulkStatus as
            | "TESTING"
            | "PASTEURIZED"
            | "AVAILABLE"
            | "DISPOSED")
        : undefined,
      notes: bulkNotes.trim() || undefined,
      pre_pasteurization_colony_count:
        activeStage === "PRE_PASTEURIZATION" ? colonyCountNum : undefined,
      post_pasteurization_colony_count:
        activeStage === "POST_PASTEURIZATION" ? colonyCountNum : undefined,
    });

    if (response.success) {
      toast.success(
        `Bulk update successful — ${response.data?.updated ?? selectedBatchSummaries.length} batch(es) updated.`
      );
      setBulkNotes("");
      setBulkStatus("");
      setColonyCount("");
      onClearSelection();
    } else {
      const errors = response.errors;
      const firstError = errors
        ? Object.values(errors).flat()[0]
        : "An error occurred";
      toast.error(firstError ?? "Bulk update failed");
    }

    setIsSubmitting(false);
  }

  const totalVolume = selectedBatchSummaries.reduce(
    (sum, b) => sum + b.total_volume,
    0
  );

  return (
    <div className="bg-background border border-border rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="size-4 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Bulk Edit
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Editing {selectedBatchSummaries.length} batches
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClearSelection}
          className="text-muted-foreground"
        >
          {"\u2715"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Summary Stats */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 p-2.5 rounded-md border border-border/50">
              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                Selected
              </label>
              <span className="text-lg font-semibold text-foreground leading-none">
                {selectedBatchSummaries.length}
              </span>
            </div>
            <div className="bg-muted/50 p-2.5 rounded-md border border-border/50">
              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                Total Volume
              </label>
              <div className="flex items-end gap-1">
                <span className="text-lg font-semibold text-foreground leading-none">
                  {totalVolume.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">mL</span>
              </div>
            </div>
          </div>
        </section>

        {/* Selected Batch List */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Selected Batches
          </h4>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
            {selectedBatchSummaries.map((b) => (
              <div
                key={b.batch_id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md border border-border/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">
                    {b.batch_code}
                  </span>
                  <BatchStatusBadge status={b.status} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {b.total_volume.toLocaleString()} mL
                </span>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-border/50" />

        {/* Bulk Test Results */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Test Results
          </h4>

          <div className="flex gap-1 mb-4 bg-muted p-[3px] rounded-md">
            <button
              onClick={() => setActiveStage("PRE_PASTEURIZATION")}
              className={cn(
                "flex-1 py-1.5 px-2 text-[11px] font-medium rounded transition-all",
                activeStage === "PRE_PASTEURIZATION"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pre-Pasteurization
            </button>
            <button
              onClick={() => setActiveStage("POST_PASTEURIZATION")}
              className={cn(
                "flex-1 py-1.5 px-2 text-[11px] font-medium rounded transition-all",
                activeStage === "POST_PASTEURIZATION"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Post-Pasteurization
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {activeStage === "PRE_PASTEURIZATION"
                  ? "Pre-Pasteurization"
                  : "Post-Pasteurization"}{" "}
                Colony Count (CFU/mL)
              </Label>
              <Input
                type="number"
                min={0}
                value={colonyCount}
                onChange={(e) => setColonyCount(e.target.value)}
                placeholder="e.g. 15000"
                className="mt-1.5 h-8 text-xs bg-background border-border"
              />
            </div>
          </div>
        </section>

        <Separator className="bg-border/50" />

        {/* Bulk Status Selector */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Bulk Status Update
          </h4>

          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Target Status
              </Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="mt-1.5 h-8 text-xs bg-background border-border w-full">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {BULK_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Bulk Notes (optional)
              </Label>
              <Textarea
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Apply common remarks to all selected batches..."
                className="mt-1.5 min-h-[60px] text-xs bg-background border-border resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                {bulkNotes.length}/500
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-muted flex gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs border-border"
          onClick={onClearSelection}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
          disabled={isSubmitting || !hasAnyBulkField}
          onClick={handleBulkSave}
        >
          {isSubmitting ? (
            <Loader2 className="size-3.5 animate-spin mr-1.5" />
          ) : null}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function SingleBatchPanel({
  batch,
  onClose,
}: {
  batch: LabBatchDetail | null;
  onClose: () => void;
}) {
  const [activeStage, setActiveStage] = useState<
    "PRE_PASTEURIZATION" | "POST_PASTEURIZATION"
  >("PRE_PASTEURIZATION");
  const [remarks, setRemarks] = useState("");
  const [colonyCount, setColonyCount] = useState("");
  const transitions = batch
    ? STATUS_TRANSITIONS[batch.status] ?? []
    : [];
  const [targetStatus, setTargetStatus] = useState<string>(
    transitions[0]?.value ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingResults, setIsSavingResults] = useState(false);

  if (!batch) {
    return (
      <div className="bg-background border border-border rounded-lg flex flex-col items-center justify-center p-8 text-center">
        <FlaskConical className="size-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Select a batch
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Click a row in the table to view batch details and record lab
          results.
        </p>
      </div>
    );
  }

  const prePastResult = batch.lab_results.find(
    (lr) => lr.stage === "PRE_PASTEURIZATION"
  );
  const postPastResult = batch.lab_results.find(
    (lr) => lr.stage === "POST_PASTEURIZATION"
  );

  const activeResult =
    activeStage === "PRE_PASTEURIZATION" ? prePastResult : postPastResult;

  async function handleRecordResult(result: "PASS" | "FAIL") {
    setIsSubmitting(true);

    const response = await recordLabResult({
      batch_id: batch!.batch_id,
      stage: activeStage,
      result,
      colony_count: colonyCount ? Number(colonyCount) : undefined,
      remarks: remarks.trim() || undefined,
    });

    if (response.success) {
      toast.success(
        `${activeStage === "PRE_PASTEURIZATION" ? "Pre-Pasteurization" : "Post-Pasteurization"} result recorded as ${result}.`
      );
      setRemarks("");
      setColonyCount("");
    } else {
      const errors = response.errors;
      const firstError = errors
        ? Object.values(errors).flat()[0]
        : "An error occurred";
      toast.error(firstError ?? "Failed to record result");
    }

    setIsSubmitting(false);
  }

  async function handleSaveLabResults() {
    if (!targetStatus) {
      toast.error("Select a target status before saving.");
      return;
    }

    setIsSavingResults(true);

    const response = await updateBatchLabResults({
      batch_id: batch!.batch_id,
      stage: activeStage,
      colony_count: colonyCount ? Number(colonyCount) : undefined,
      remarks: remarks.trim() || undefined,
      status: targetStatus as
        | "TESTING"
        | "PASTEURIZED"
        | "AVAILABLE"
        | "DISPOSED",
    });

    if (response.success) {
      toast.success("Lab results saved and batch status updated.");
      setRemarks("");
      setColonyCount("");
    } else {
      const errors = response.errors;
      const firstError = errors
        ? Object.values(errors).flat()[0]
        : "An error occurred";
      toast.error(firstError ?? "Failed to save results");
    }

    setIsSavingResults(false);
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  }

  function formatProgram(program: string): string {
    return program
      .split("_")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" ");
  }

  return (
    <div className="bg-background border border-border rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-primary">
              {batch.batch_code}
            </h3>
            <BatchStatusBadge status={batch.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {batch.collections[0]
              ? formatProgram(batch.collections[0].program)
              : "--"}{" "}
            {"\u00B7"} Created {formatDate(batch.created_at)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          className="text-muted-foreground"
        >
          {"\u2715"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Batch Summary */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 p-2.5 rounded-md border border-border/50">
              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                Total Volume
              </label>
              <div className="flex items-end gap-1">
                <span className="text-lg font-semibold text-foreground leading-none">
                  {batch.total_volume.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">mL</span>
              </div>
            </div>
            <div className="bg-muted/50 p-2.5 rounded-md border border-border/50">
              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                Collections
              </label>
              <div className="flex items-end gap-1">
                <span className="text-lg font-semibold text-foreground leading-none">
                  {batch.collections.length}
                </span>
                <span className="text-xs text-muted-foreground">donors</span>
              </div>
            </div>
          </div>
        </section>

        <Separator className="bg-border/50" />

        {/* Lab Stage Tabs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Lab Results
            </h4>
          </div>

          <div className="flex gap-1 mb-4 bg-muted p-[3px] rounded-md">
            <button
              onClick={() => setActiveStage("PRE_PASTEURIZATION")}
              className={cn(
                "flex-1 py-1.5 px-2 text-[11px] font-medium rounded transition-all",
                activeStage === "PRE_PASTEURIZATION"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pre-Pasteurization
            </button>
            <button
              onClick={() => setActiveStage("POST_PASTEURIZATION")}
              className={cn(
                "flex-1 py-1.5 px-2 text-[11px] font-medium rounded transition-all",
                activeStage === "POST_PASTEURIZATION"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Post-Pasteurization
            </button>
          </div>

          {activeResult ? (
            <div className="bg-muted/50 p-3 rounded-md border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeResult.result === "PASS" ? (
                    <CheckCircle className="size-4 text-primary" />
                  ) : activeResult.result === "FAIL" ? (
                    <XCircle className="size-4 text-destructive" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground" />
                  )}
                  <LabResultBadge
                    result={
                      activeResult.result as "PASS" | "FAIL" | "PENDING"
                    }
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatDateTime(activeResult.test_date)}
                </span>
              </div>
              {activeResult.colony_count != null && (
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <span className="text-muted-foreground">
                    Colony Count:
                  </span>
                  <span className="font-semibold tabular-nums">
                    {activeResult.colony_count.toLocaleString()} CFU/mL
                  </span>
                </div>
              )}
              {activeResult.remarks && (
                <p className="text-xs text-muted-foreground italic">
                  &ldquo;{activeResult.remarks}&rdquo;
                </p>
              )}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <User className="size-3" />
                {activeResult.tester_name}
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 p-3 rounded-md border border-dashed border-border text-center">
              <Beaker className="size-5 text-muted-foreground/40 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">
                No result recorded yet
              </p>
            </div>
          )}
        </section>

        <Separator className="bg-border/50" />

        {/* Microbiological Result Input Form */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Microbiological Results
          </h4>

          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Total Colony Count (CFU/mL)
              </Label>
              <Input
                type="number"
                min={0}
                value={colonyCount}
                onChange={(e) => setColonyCount(e.target.value)}
                placeholder="e.g. 15000"
                className="mt-1.5 h-8 text-xs bg-background border-border"
              />
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Remarks / Notes
              </Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Observations, anomalies, or additional notes..."
                className="mt-1.5 min-h-[60px] text-xs bg-background border-border resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                {remarks.length}/500
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleRecordResult("PASS")}
                disabled={isSubmitting}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="size-3.5" />
                )}
                Pass
              </Button>
              <Button
                onClick={() => handleRecordResult("FAIL")}
                disabled={isSubmitting}
                variant="destructive"
                className="flex-1 text-xs font-medium"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <XCircle className="size-3.5" />
                )}
                Fail
              </Button>
            </div>
          </div>
        </section>

        <Separator className="bg-border/50" />

        {/* Status Transition */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Status Transition
          </h4>

          {transitions.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BatchStatusBadge status={batch.status} />
                <ArrowRight className="size-3.5" />
                <span className="font-medium text-foreground">Next</span>
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Target Status
                </Label>
                <Select
                  value={targetStatus}
                  onValueChange={setTargetStatus}
                >
                  <SelectTrigger className="mt-1.5 h-8 text-xs bg-background border-border w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {transitions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSaveLabResults}
                disabled={isSavingResults || !targetStatus}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
              >
                {isSavingResults ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : null}
                Save Results &amp; Update Status
              </Button>
            </div>
          ) : (
            <div className="bg-muted/30 p-3 rounded-md border border-dashed border-border text-center">
              <p className="text-xs text-muted-foreground">
                No status transitions available for current status.
              </p>
            </div>
          )}
        </section>

        <Separator className="bg-border/50" />

        {/* Collections */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Collections ({batch.collections.length})
          </h4>
          <div className="space-y-2 max-h-[120px] overflow-y-auto">
            {batch.collections.map((c) => (
              <div
                key={c.ctn}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md border border-border/50"
              >
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {c.donor_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    CTN-{c.ctn.toString().padStart(4, "0")} {"\u00B7"}{" "}
                    {formatProgram(c.program)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {c.volume} mL
                </span>
              </div>
            ))}
            {batch.collections.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No collections linked.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-muted flex gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs border-border"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

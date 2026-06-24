"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/core/ui/badge";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { Textarea } from "@/core/ui/textarea";
import { Separator } from "@/core/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { BatchStatusBadge } from "./batch-status-badge";
import { LabResultBadge } from "./lab-result-badge";
import { cn } from "@/core/utils/cn";
import { formatProgram } from "@/core/utils/program";
import {
  bulkSetLabResultForBatch,
  bulkSetSentToLabForBatch,
  recordLabResult,
  saveLabBatchSelection,
} from "../actions";
import {
  SampleTracker,
  StepActionDialog,
  type StepTarget,
} from "@/features/supsup-todo/components/supsup-todo-details-modal";
import {
  WorkflowCircle,
  type WorkflowCircleState,
} from "@/features/supsup-todo/components/workflow-circle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/ui/dialog";
import { toast } from "sonner";
import {
  FlaskConical,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Beaker,
  Loader2,
  Layers,
} from "lucide-react";
import type { LabBatchDetail, LabBatchSummary } from "../queries";
import {
  LAB_BATCH_TYPES,
  getLabBatchTypeMeta,
  type LabBatchType,
} from "../batch-eligibility";

interface BatchDetailPanelProps {
  batch: LabBatchDetail | null;
  selectedBatchIds: Set<number>;
  selectedBatchSummaries: LabBatchSummary[];
  onClose: () => void;
  onBatchUpdated: () => Promise<void> | void;
  isBatchMode: boolean;
  batchType: LabBatchType;
  onBatchTypeChange: (batchType: LabBatchType) => void;
  onExitBatchMode: () => void;
}

export function BatchDetailPanel({
  batch,
  selectedBatchIds,
  selectedBatchSummaries,
  onClose,
  onBatchUpdated,
  isBatchMode,
  batchType,
  onBatchTypeChange,
  onExitBatchMode,
}: BatchDetailPanelProps) {
  if (isBatchMode) {
    return (
      <BulkEditPanel
        selectedBatchSummaries={selectedBatchSummaries}
        selectedCount={selectedBatchIds.size}
        batchType={batchType}
        onBatchTypeChange={onBatchTypeChange}
        onExitBatchMode={onExitBatchMode}
        onBatchUpdated={onBatchUpdated}
      />
    );
  }

  return (
      <SingleBatchPanel
        key={batch?.batch_id}
        batch={batch}
        onClose={onClose}
        onBatchUpdated={onBatchUpdated}
      />
  );
}

function BulkEditPanel({
  selectedBatchSummaries,
  selectedCount,
  batchType,
  onBatchTypeChange,
  onExitBatchMode,
  onBatchUpdated,
}: {
  selectedBatchSummaries: LabBatchSummary[];
  selectedCount: number;
  batchType: LabBatchType;
  onBatchTypeChange: (batchType: LabBatchType) => void;
  onExitBatchMode: () => void;
  onBatchUpdated: () => Promise<void> | void;
}) {
  const [bulkNotes, setBulkNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepTarget, setStepTarget] = useState<StepTarget | null>(null);
  const [fullDetailsOpen, setFullDetailsOpen] = useState(false);
  const batchMeta = getLabBatchTypeMeta(batchType);

  async function handleBulkSave() {
    if (selectedBatchSummaries.length === 0) {
      toast.error("Select at least one eligible collection.");
      return;
    }

    setIsSubmitting(true);

    const response = await saveLabBatchSelection({
      batch_ids: selectedBatchSummaries.map((b) => b.batch_id),
      batch_type: batchType,
      notes: bulkNotes.trim() || undefined,
    });

    if (response.success) {
      const count = response.data?.selected ?? selectedBatchSummaries.length;
      const batchNo = response.data?.batch_no ?? response.data?.batch_action_id ?? batchMeta.auditPrefix;
      toast.success(
        `${batchNo} created with ${count} collection${count === 1 ? "" : "s"}.`
      );
      setBulkNotes("");
      await onBatchUpdated();
      onExitBatchMode();
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
    (sum, b) => sum + b.remaining_volume,
    0
  );
  const targetWorkflow =
    stepTarget && "workflowId" in stepTarget
      ? selectedBatchSummaries
          .map((summary) => summary.supSupTodoWorkflow)
          .find((workflow) => workflow?.workflow_id === stepTarget.workflowId) ?? null
      : null;

  return (
    <div className="bg-background border border-border rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="size-4 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Batch Mode
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {batchMeta.title}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setFullDetailsOpen(true)}
            className="text-muted-foreground"
            aria-label="Open batch details"
            title="Open batch details"
          >
            <span className="text-[10px] font-semibold">Full</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onExitBatchMode}
            className="text-muted-foreground"
            aria-label="Exit batch mode"
          >
            {"\u2715"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section>
          <div className="grid grid-cols-1 gap-1.5">
            {LAB_BATCH_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => onBatchTypeChange(type.value)}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors",
                  batchType === type.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </section>

        {/* Summary Stats */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 p-2.5 rounded-md border border-border/50">
              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                Selected
              </label>
              <span className="text-lg font-semibold text-foreground leading-none">
                {selectedCount}
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
            Selected Collections
          </h4>
          <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {selectedBatchSummaries.map((b) => (
              <div
                key={b.batch_id}
                className="space-y-2 p-2 bg-muted/50 rounded-md border border-border/50"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-xs font-semibold text-primary">
                      {b.tracking_no ?? b.batch_code}
                    </span>
                    <WorkflowStatusBadge batch={b} batchType={batchType} />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {b.remaining_volume.toLocaleString()} mL
                  </span>
                </div>
                <RelevantBatchTracker
                  batch={b}
                  batchType={batchType}
                  onSelectStep={setStepTarget}
                />
              </div>
            ))}
            {selectedBatchSummaries.length === 0 && (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                Select eligible collections from the table.
              </div>
            )}
          </div>
        </section>

        <Separator className="bg-border/50" />

        {/* Batch Notes */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Batch Notes
          </h4>

          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Notes (optional)
              </Label>
              <Textarea
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Add notes for this batch action..."
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
          onClick={onExitBatchMode}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
          disabled={isSubmitting || selectedBatchSummaries.length === 0}
          onClick={handleBulkSave}
        >
          {isSubmitting ? (
            <Loader2 className="size-3.5 animate-spin mr-1.5" />
          ) : null}
          Save Changes
        </Button>
      </div>

      <BatchFullDetailsDialog
        open={fullDetailsOpen}
        onOpenChange={setFullDetailsOpen}
        batchType={batchType}
        selectedBatchSummaries={selectedBatchSummaries}
        totalVolume={totalVolume}
        onSelectStep={setStepTarget}
      />

      <StepActionDialog
        donorId={targetWorkflow?.donor_id ?? 0}
        target={stepTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStepTarget(null);
        }}
        onUpdated={onBatchUpdated}
        workflow={targetWorkflow}
        eligibility={null}
      />
    </div>
  );
}

function todayInputValue() {
  return new Date().toISOString().split("T")[0];
}

function addDaysInputValue(dateValue: string, days: number) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function bottleNumberFor(batch: LabBatchSummary) {
  return (
    batch.supSupTodoWorkflow?.bottle_no ??
    batch.supSupTodoWorkflow?.collection?.bottle_no ??
    "Not recorded"
  );
}

function workflowCanBeSentToLab(batch: LabBatchSummary, batchType: LabBatchType) {
  const workflow = batch.supSupTodoWorkflow;
  if (!workflow || workflow.current_step === "DISPOSED") return false;
  if (batch.status === "AVAILABLE" || batch.status === "DISPOSED") return false;

  if (batchType === "PRE_PSTR") {
    return (
      (workflow.pre_collection_confirmed || !!workflow.cold_chain_started_at) &&
      !workflow.pre_lab_result &&
      !workflow.pasteurization_confirmed &&
      !workflow.post_sent_to_lab &&
      !workflow.post_lab_result
    );
  }

  if (batchType === "POST_PSTR") {
    return (
      workflow.pre_lab_result === "PASS" &&
      workflow.pasteurization_confirmed &&
      !workflow.post_lab_result
    );
  }

  return false;
}

function workflowCanReceiveLabResult(batch: LabBatchSummary, batchType: LabBatchType) {
  const workflow = batch.supSupTodoWorkflow;
  if (!workflow || workflow.current_step === "DISPOSED") return false;
  if (batch.status === "AVAILABLE" || batch.status === "DISPOSED") return false;

  if (batchType === "PRE_PSTR") {
    return workflow.pre_sent_to_lab && !workflow.pre_lab_result;
  }

  if (batchType === "POST_PSTR") {
    return (
      workflow.pre_lab_result === "PASS" &&
      workflow.post_sent_to_lab &&
      !workflow.post_lab_result
    );
  }

  return false;
}

function BulkSentToLabDialog({
  open,
  onOpenChange,
  collectionBatchId,
  batchType,
  eligibleCount,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionBatchId: number;
  batchType: LabBatchType;
  eligibleCount: number;
  onSaved: () => Promise<void> | void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialSentDate = todayInputValue();
  const [sentDate, setSentDate] = useState(initialSentDate);
  const [expectedDate, setExpectedDate] = useState(
    addDaysInputValue(initialSentDate, 14)
  );
  const stage =
    batchType === "PRE_PSTR" ? "PRE_PASTEURIZATION" : "POST_PASTEURIZATION";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);

    const response = await bulkSetSentToLabForBatch({
      collection_batch_id: collectionBatchId,
      stage,
      sample_volume: formData.get("sample_volume")?.toString(),
      sent_date: formData.get("sent_date")?.toString(),
      expected_result_date: formData.get("expected_result_date")?.toString(),
      staff_notes: formData.get("staff_notes")?.toString().trim() || undefined,
    });

    if (response.success && response.data) {
      toast.success(`Sent to Lab applied to ${response.data.updated} collection(s).`);
      await onSaved();
      onOpenChange(false);
    } else {
      const firstError = Object.values(response.errors ?? {}).flat()[0];
      toast.error(firstError ?? "Failed to apply Sent to Lab.");
    }

    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-base text-foreground">
            Set All Sent to Lab
          </DialogTitle>
          <DialogDescription>
            Apply common Sent to Lab values to {eligibleCount} eligible collection(s).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="bulk_sample_volume">Sample Volume in mL</Label>
            <Input
              id="bulk_sample_volume"
              name="sample_volume"
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              required
              className="bg-card border-border"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bulk_sent_date">Sent Date</Label>
            <Input
              id="bulk_sent_date"
              name="sent_date"
              type="date"
              value={sentDate}
              onChange={(event) => {
                setSentDate(event.target.value);
                setExpectedDate(addDaysInputValue(event.target.value, 14));
              }}
              required
              className="bg-card border-border"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bulk_expected_result_date">Expected Result Date</Label>
            <Input
              id="bulk_expected_result_date"
              name="expected_result_date"
              type="date"
              value={expectedDate}
              onChange={(event) => setExpectedDate(event.target.value)}
              required
              className="bg-card border-border"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bulk_sent_notes">Staff Notes</Label>
            <Textarea
              id="bulk_sent_notes"
              name="staff_notes"
              className="min-h-20 bg-card border-border"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Apply
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkLabResultDialog({
  open,
  onOpenChange,
  collectionBatchId,
  batchType,
  eligibleCount,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionBatchId: number;
  batchType: LabBatchType;
  eligibleCount: number;
  onSaved: () => Promise<void> | void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRaw, setPendingRaw] = useState<Record<string, FormDataEntryValue> | null>(
    null
  );
  const stage =
    batchType === "PRE_PSTR" ? "PRE_PASTEURIZATION" : "POST_PASTEURIZATION";
  const pendingResult = pendingRaw?.lab_result;

  async function save(raw: Record<string, FormDataEntryValue>) {
    setIsSubmitting(true);
    const response = await bulkSetLabResultForBatch({
      collection_batch_id: collectionBatchId,
      stage,
      lab_result: raw.lab_result?.toString(),
      result_received_date: raw.result_received_date?.toString(),
      colony_count: raw.colony_count?.toString() || undefined,
      staff_notes: raw.staff_notes?.toString().trim() || undefined,
    });

    if (response.success && response.data) {
      toast.success(`Lab Result applied to ${response.data.updated} collection(s).`);
      setPendingRaw(null);
      await onSaved();
      onOpenChange(false);
    } else {
      const firstError = Object.values(response.errors ?? {}).flat()[0];
      toast.error(firstError ?? "Failed to apply Lab Result.");
    }

    setIsSubmitting(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingRaw(Object.fromEntries(new FormData(event.currentTarget).entries()));
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-base text-foreground">
              Set All Lab Result
            </DialogTitle>
            <DialogDescription>
              Apply one lab result to {eligibleCount} eligible collection(s).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk_lab_result">Lab Result</Label>
              <select
                id="bulk_lab_result"
                name="lab_result"
                required
                className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground"
                defaultValue="PASS"
              >
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk_result_received_date">Result Received Date</Label>
              <Input
                id="bulk_result_received_date"
                name="result_received_date"
                type="date"
                defaultValue={todayInputValue()}
                required
                className="bg-card border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk_colony_count">Colony Count</Label>
              <Input
                id="bulk_colony_count"
                name="colony_count"
                type="number"
                min="0"
                className="bg-card border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk_lab_notes">Staff Notes</Label>
              <Textarea
                id="bulk_lab_notes"
                name="staff_notes"
                className="min-h-20 bg-card border-border"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Continue
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!pendingRaw}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingRaw(null);
        }}
      >
        <DialogContent className="max-w-sm bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-base text-foreground">
              Confirm {pendingResult === "FAIL" ? "Failed" : "Passed"} Results
            </DialogTitle>
            <DialogDescription>
              {`Are you sure you want to mark all selected batch records as ${pendingResult === "FAIL" ? "FAILED" : "PASSED"}?`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setPendingRaw(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={pendingResult === "FAIL" ? "destructive" : "default"}
              disabled={isSubmitting || !pendingRaw}
              onClick={() => {
                if (pendingRaw) void save(pendingRaw);
              }}
            >
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BatchFullDetailsDialog({
  open,
  onOpenChange,
  batchType,
  selectedBatchSummaries,
  totalVolume,
  onSelectStep,
  title,
  description,
  notes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchType: LabBatchType;
  selectedBatchSummaries: LabBatchSummary[];
  totalVolume: number;
  onSelectStep: (target: StepTarget) => void;
  title?: string;
  description?: string;
  notes?: string | null;
}) {
  const batchMeta = getLabBatchTypeMeta(batchType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-7xl max-h-[90vh] overflow-hidden flex flex-col bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">
            {title ?? batchMeta.title}
          </DialogTitle>
          <DialogDescription>
            {description ? `${description} \u00B7 ` : ""}
            {selectedBatchSummaries.length} selected collection(s) {"\u00B7"}{" "}
            {totalVolume.toLocaleString()} mL total
          </DialogDescription>
        </DialogHeader>

        {notes && (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            {notes}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="text-xs">CTN</TableHead>
                <TableHead className="text-xs">Donor Name</TableHead>
                <TableHead className="text-xs">Program</TableHead>
                <TableHead className="text-xs">Bottle No</TableHead>
                <TableHead className="text-right text-xs">Volume</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="min-w-[260px] text-xs">Tracker</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedBatchSummaries.map((batch) => (
                <TableRow key={batch.batch_id}>
                  <TableCell className="text-xs font-semibold text-primary">
                    {batch.tracking_no ?? batch.batch_code}
                  </TableCell>
                  <TableCell className="text-xs">{batch.donor_name}</TableCell>
                  <TableCell className="text-xs">
                    {formatProgram(batch.program)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {bottleNumberFor(batch)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {batch.remaining_volume.toLocaleString()} mL
                  </TableCell>
                  <TableCell>
                    <WorkflowStatusBadge batch={batch} batchType={batchType} />
                  </TableCell>
                  <TableCell>
                    <RelevantBatchTracker
                      batch={batch}
                      batchType={batchType}
                      onSelectStep={onSelectStep}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {selectedBatchSummaries.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No selected collections.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RelevantBatchTracker({
  batch,
  batchType,
  onSelectStep,
}: {
  batch: LabBatchSummary;
  batchType: LabBatchType;
  onSelectStep: (target: StepTarget) => void;
}) {
  const workflow = batch.supSupTodoWorkflow;

  if (!workflow) {
    return (
      <p className="text-[10px] text-muted-foreground">
        No linked workflow tracker.
      </p>
    );
  }

  const stopped = workflow.current_step === "DISPOSED";
  const inCollectionComplete =
    workflow.pre_collection_confirmed || !!workflow.cold_chain_started_at;

  if (batchType === "PRE_PSTR") {
    return (
      <div className="flex items-start gap-1">
        <WorkflowCircle
          label="In Collection"
          state={inCollectionComplete ? "completed" : "not_started"}
          compact
          disabled
          onBlockedClick={() => toast.info("This status is set from collection preparation.")}
        />
        <MiniConnector />
        <WorkflowCircle
          label="Sent to Lab"
          state={workflow.pre_sent_to_lab ? "completed" : "active"}
          disabled={!inCollectionComplete || stopped}
          compact
          onClick={() =>
            onSelectStep({ type: "pre_sent", workflowId: workflow.workflow_id })
          }
        />
        <MiniConnector />
        <WorkflowCircle
          label="Lab Result"
          state={labResultState(workflow.pre_lab_result, workflow.pre_sent_to_lab)}
          disabled={!workflow.pre_sent_to_lab || stopped}
          compact
          onClick={() =>
            onSelectStep({ type: "pre_result", workflowId: workflow.workflow_id })
          }
        />
      </div>
    );
  }

  if (batchType === "PSTR") {
    return (
      <div className="flex max-w-[120px] items-start gap-1">
        <WorkflowCircle
          label="Pasteurization"
          state={workflow.pasteurization_confirmed ? "completed" : "active"}
          disabled={workflow.pre_lab_result !== "PASS" || stopped}
          compact
          onClick={() =>
            onSelectStep({
              type: "pasteurization",
              workflowId: workflow.workflow_id,
            })
          }
        />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-1">
      <WorkflowCircle
        label="Pasteurization"
        state={workflow.pasteurization_confirmed ? "completed" : "not_started"}
        disabled
        compact
        onBlockedClick={() => toast.info("Pasteurization is completed context for this batch type.")}
      />
      <MiniConnector />
      <WorkflowCircle
        label="Sent to Lab"
        state={workflow.post_sent_to_lab ? "completed" : "active"}
        disabled={!workflow.pasteurization_confirmed || stopped}
        compact
        onClick={() =>
          onSelectStep({ type: "post_sent", workflowId: workflow.workflow_id })
        }
      />
      <MiniConnector />
      <WorkflowCircle
        label="Lab Result"
        state={labResultState(workflow.post_lab_result, workflow.post_sent_to_lab)}
        disabled={!workflow.post_sent_to_lab || stopped}
        compact
        onClick={() =>
          onSelectStep({ type: "post_result", workflowId: workflow.workflow_id })
        }
      />
    </div>
  );
}

function WorkflowStatusBadge({
  batch,
  batchType,
}: {
  batch: LabBatchSummary;
  batchType: LabBatchType;
}) {
  const workflow = batch.supSupTodoWorkflow;
  const label =
    batchType === "PRE_PSTR"
      ? workflow?.pre_lab_result === "PASS"
        ? "Passed"
        : workflow?.pre_lab_result === "FAIL"
          ? "Failed"
          : workflow?.pre_sent_to_lab
            ? "Awaiting Result"
            : "Ready for Lab"
      : batchType === "PSTR"
        ? workflow?.pasteurization_confirmed
          ? "Pasteurized"
          : "Ready for Pasteurization"
        : workflow?.post_lab_result === "PASS"
          ? "Passed"
          : workflow?.post_lab_result === "FAIL"
            ? "Failed"
            : workflow?.post_sent_to_lab
              ? "Awaiting Result"
              : "Ready for Lab";

  return (
    <Badge
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold",
        label === "Passed"
          ? "bg-green-600/10 text-green-700 border-green-600/30"
          : label === "Failed"
            ? "bg-destructive/10 text-destructive border-destructive/20"
            : label === "Awaiting Result"
              ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/30"
              : label === "Ready for Lab"
                ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                : label === "Pasteurized"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted text-muted-foreground border-border"
      )}
    >
      {label}
    </Badge>
  );
}

function labResultState(
  result: string | null | undefined,
  sentToLab: boolean
): WorkflowCircleState {
  if (result === "FAIL") return "failed";
  if (result === "PASS") return "completed";
  return sentToLab ? "waiting" : "not_started";
}

function MiniConnector() {
  return <div className="mt-3 h-px w-3 shrink-0 bg-border" />;
}

function SavedBatchStatusBadge({ label }: { label: string }) {
  return (
    <Badge className="inline-flex rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
      {label}
    </Badge>
  );
}

function SavedCollectionBatchPanel({
  batch,
  onClose,
  onBatchUpdated,
}: {
  batch: LabBatchDetail;
  onClose: () => void;
  onBatchUpdated: () => Promise<void> | void;
}) {
  const [stepTarget, setStepTarget] = useState<StepTarget | null>(null);
  const [fullDetailsOpen, setFullDetailsOpen] = useState(false);
  const [bulkSentOpen, setBulkSentOpen] = useState(false);
  const [bulkResultOpen, setBulkResultOpen] = useState(false);
  const batchType = batch.collection_batch_type ?? "PRE_PSTR";
  const items = batch.collection_batch_items ?? [];
  const sentEligibleCount = items.filter((item) =>
    workflowCanBeSentToLab(item, batchType)
  ).length;
  const resultEligibleCount = items.filter((item) =>
    workflowCanReceiveLabResult(item, batchType)
  ).length;
  const showLabBatchActions = batchType === "PRE_PSTR" || batchType === "POST_PSTR";
  const targetWorkflow =
    stepTarget && "workflowId" in stepTarget
      ? items
          .map((summary) => summary.supSupTodoWorkflow)
          .find((workflow) => workflow?.workflow_id === stepTarget.workflowId) ?? null
      : null;

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  return (
    <div className="bg-background border border-border rounded-lg flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-primary">
              {batch.collection_batch_no ?? batch.batch_code}
            </h3>
            <SavedBatchStatusBadge label={batch.collection_batch_status ?? "In Progress"} />
          </div>
          <p className="text-xs text-muted-foreground">
            {getLabBatchTypeMeta(batchType).label} {"\u00B7"} Created{" "}
            {formatDate(batch.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setFullDetailsOpen(true)}
            className="text-muted-foreground"
            aria-label="Open full batch details"
            title="Open full batch details"
          >
            <span className="text-[10px] font-semibold">Full</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-muted-foreground"
          >
            {"\u2715"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
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
              <span className="text-lg font-semibold text-foreground leading-none">
                {items.length}
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Created by {batch.creator_name}
          </p>
        </section>

        <Separator className="bg-border/50" />

        <section>
          <div className="mb-3 flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Included Collections
            </h4>
            {showLabBatchActions ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="text-[11px]"
                  disabled={sentEligibleCount === 0}
                  title={
                    sentEligibleCount === 0
                      ? "No eligible collections for this action."
                      : undefined
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    setBulkSentOpen(true);
                  }}
                >
                  Set All Sent to Lab
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="text-[11px]"
                  disabled={resultEligibleCount === 0}
                  title={
                    resultEligibleCount === 0
                      ? "No eligible collections for this action."
                      : undefined
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    setBulkResultOpen(true);
                  }}
                >
                  Set All Lab Result
                </Button>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.batch_id}
                className="space-y-2 rounded-md border border-border/50 bg-muted/50 p-2"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-primary">
                      {item.display_id ?? item.tracking_no ?? item.batch_code}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.donor_name} {"\u00B7"} {formatProgram(item.program)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Bottle No: {bottleNumberFor(item)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <WorkflowStatusBadge batch={item} batchType={batchType} />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {item.remaining_volume.toLocaleString()} mL
                    </span>
                  </div>
                </div>
                <RelevantBatchTracker
                  batch={item}
                  batchType={batchType}
                  onSelectStep={setStepTarget}
                />
              </div>
            ))}
            {items.length === 0 && (
              <p className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                No collections linked.
              </p>
            )}
          </div>
        </section>

        {batch.notes && (
          <>
            <Separator className="bg-border/50" />
            <section>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Notes
              </h4>
              <p className="text-xs text-muted-foreground">{batch.notes}</p>
            </section>
          </>
        )}
      </div>

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

      <BatchFullDetailsDialog
        open={fullDetailsOpen}
        onOpenChange={setFullDetailsOpen}
        batchType={batchType}
        selectedBatchSummaries={items}
        totalVolume={batch.total_volume}
        onSelectStep={setStepTarget}
        title={batch.collection_batch_no ?? batch.batch_code}
        description={`${getLabBatchTypeMeta(batchType).label} · ${batch.collection_batch_status ?? "In Progress"}`}
        notes={batch.notes}
      />

      {showLabBatchActions && batch.collection_batch_id ? (
        <>
          <BulkSentToLabDialog
            open={bulkSentOpen}
            onOpenChange={setBulkSentOpen}
            collectionBatchId={batch.collection_batch_id}
            batchType={batchType}
            eligibleCount={sentEligibleCount}
            onSaved={onBatchUpdated}
          />
          <BulkLabResultDialog
            open={bulkResultOpen}
            onOpenChange={setBulkResultOpen}
            collectionBatchId={batch.collection_batch_id}
            batchType={batchType}
            eligibleCount={resultEligibleCount}
            onSaved={onBatchUpdated}
          />
        </>
      ) : null}

      <StepActionDialog
        donorId={targetWorkflow?.donor_id ?? 0}
        target={stepTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStepTarget(null);
        }}
        onUpdated={onBatchUpdated}
        workflow={targetWorkflow}
        eligibility={null}
      />
    </div>
  );
}

function SingleBatchPanel({
  batch,
  onClose,
  onBatchUpdated,
}: {
  batch: LabBatchDetail | null;
  onClose: () => void;
  onBatchUpdated: () => Promise<void> | void;
}) {
  const [activeStage, setActiveStage] = useState<
    "PRE_PASTEURIZATION" | "POST_PASTEURIZATION"
  >("PRE_PASTEURIZATION");
  const [remarks, setRemarks] = useState("");
  const [colonyCount, setColonyCount] = useState("");
  const [stepTarget, setStepTarget] = useState<StepTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (batch.row_type === "collection_batch") {
    return (
      <SavedCollectionBatchPanel
        batch={batch}
        onClose={onClose}
        onBatchUpdated={onBatchUpdated}
      />
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
      await onBatchUpdated();
    } else {
      const errors = response.errors;
      const firstError = errors
        ? Object.values(errors).flat()[0]
        : "An error occurred";
      toast.error(firstError ?? "Failed to record result");
    }

    setIsSubmitting(false);
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

  return (
    <div className="bg-background border border-border rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-primary">
              {batch.tracking_no ?? batch.batch_code}
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
                Remaining Volume
              </label>
              <div className="flex items-end gap-1">
                <span className="text-lg font-semibold text-foreground leading-none">
                  {batch.remaining_volume.toLocaleString()}
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

        {!batch.supSupTodoWorkflow && (
          <>
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
          </>
        )}

        <Separator className="bg-border/50" />

        {/* Sample Workflow */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Workflow
          </h4>

          {batch.supSupTodoWorkflow ? (
            <SampleTracker
              workflow={batch.supSupTodoWorkflow}
              compact
              onSelectStep={setStepTarget}
            />
          ) : (
            <div className="bg-muted/30 p-3 rounded-md border border-dashed border-border text-center">
              <p className="text-xs text-muted-foreground">
                No sample workflow is linked to this collection.
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
                    {c.tracking_no ?? `CTN-${c.ctn.toString().padStart(4, "0")}`} {"\u00B7"}{" "}
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

      <StepActionDialog
        donorId={batch.supSupTodoWorkflow?.donor_id ?? 0}
        target={stepTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStepTarget(null);
        }}
        onUpdated={onBatchUpdated}
        workflow={batch.supSupTodoWorkflow}
        eligibility={null}
      />
    </div>
  );
}

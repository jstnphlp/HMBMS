"use client";

import { useState } from "react";
import { Button } from "@/core/ui/button";
import { Badge } from "@/core/ui/badge";
import { Textarea } from "@/core/ui/textarea";
import { Separator } from "@/core/ui/separator";
import { BatchStatusBadge } from "./batch-status-badge";
import { LabResultBadge } from "./lab-result-badge";
import { cn } from "@/core/utils/cn";
import { recordLabResult } from "../actions";
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Beaker,
  Loader2,
} from "lucide-react";
import type { LabBatchDetail } from "../queries";

interface BatchDetailPanelProps {
  batch: LabBatchDetail | null;
  onClose: () => void;
}

export function BatchDetailPanel({ batch, onClose }: BatchDetailPanelProps) {
  const [activeStage, setActiveStage] = useState<
    "PRE_PASTEURIZATION" | "POST_PASTEURIZATION"
  >("PRE_PASTEURIZATION");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!batch) {
    return (
      <div className="lg:col-span-1 bg-background border border-border rounded-lg flex flex-col items-center justify-center p-8 text-center">
        <FlaskConical className="size-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Select a batch
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Click a row in the table to view batch details and record lab results.
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
    setSubmitResult(null);

    const response = await recordLabResult({
      batch_id: batch!.batch_id,
      stage: activeStage,
      result,
      remarks: remarks.trim() || undefined,
    });

    if (response.success) {
      setSubmitResult({
        success: true,
        message: `${activeStage === "PRE_PASTEURIZATION" ? "Pre-Pasteurization" : "Post-Pasteurization"} result recorded as ${result}.`,
      });
      setRemarks("");
    } else {
      const errors = response.errors;
      const firstError = errors
        ? Object.values(errors).flat()[0]
        : "An error occurred";
      setSubmitResult({ success: false, message: firstError ?? "Failed" });
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

  function formatProgram(program: string): string {
    return program
      .split("_")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" ");
  }

  return (
    <div className="lg:col-span-1 bg-background border border-border rounded-lg flex flex-col overflow-hidden">
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

          {/* Current Result Display */}
          {activeResult ? (
            <div className="bg-muted/50 p-3 rounded-md border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeResult.result === "PASS" ? (
                    <CheckCircle2 className="size-4 text-primary" />
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

        {/* Record Result Form */}
        <section>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Record Test Result
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
                Remarks (optional)
              </label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add observations, notes, or anomalies..."
                className="min-h-[60px] text-xs bg-background border-border resize-none"
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
                  <CheckCircle2 className="size-3.5" />
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

            {submitResult && (
              <div
                className={cn(
                  "text-xs p-2 rounded-md border",
                  submitResult.success
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                {submitResult.message}
              </div>
            )}
          </div>
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

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { Input } from "@/core/ui/input";
import { Button } from "@/core/ui/button";
import { Checkbox } from "@/core/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import { Badge } from "@/core/ui/badge";
import { cn } from "@/core/utils/cn";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import type { LabBatchSummary } from "../queries";

interface BatchTableProps {
  batches: LabBatchSummary[];
  selectedBatchId: number | null;
  onSelectBatch: (batchId: number) => void;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  onFilteredBatchesChange?: (batches: LabBatchSummary[]) => void;
}

const PAGE_SIZE = 15;

function formatProgram(program: string | null): string {
  if (!program) return "--";
  return program
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

function prePasteurStatus(batch: LabBatchSummary) {
  const workflow = batch.supSupTodoWorkflow;
  if (workflow) {
    if (!workflow.cold_chain_started_at) return "Not Ready";
    if (workflow.pre_lab_result === "PASS") return "Passed";
    if (workflow.pre_lab_result === "FAIL") return "Failed";
    if (workflow.pre_sent_to_lab) return "Awaiting Result";
    return "Ready for Lab";
  }

  if (batch.pre_pasteurization?.result === "PASS") return "Passed";
  if (batch.pre_pasteurization?.result === "FAIL") return "Failed";
  if (batch.pre_pasteurization?.result === "PENDING") return "Awaiting Result";
  return batch.status === "POOLING" ? "Ready for Lab" : "Not Ready";
}

function postPasteurStatus(batch: LabBatchSummary) {
  const workflow = batch.supSupTodoWorkflow;
  if (workflow) {
    if (workflow.pre_lab_result !== "PASS") return "Not Ready";
    if (!workflow.pasteurization_confirmed) return "Not Ready";
    if (workflow.post_lab_result === "PASS") return "Passed";
    if (workflow.post_lab_result === "FAIL") return "Failed";
    if (workflow.post_sent_to_lab) return "Awaiting Result";
    return "Ready for Lab";
  }

  if (batch.post_pasteurization?.result === "PASS") return "Passed";
  if (batch.post_pasteurization?.result === "FAIL") return "Failed";
  if (batch.post_pasteurization?.result === "PENDING") return "Awaiting Result";
  return batch.status === "PASTEURIZED" ? "Ready for Lab" : "Not Ready";
}

function ProcessStatusBadge({ label }: { label: string }) {
  const className =
    label === "Passed" || label === "Available"
      ? "bg-green-600/10 text-green-700 border-green-600/30"
      : label === "Failed"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : label === "To dispose"
          ? "bg-orange-500/10 text-orange-700 border-orange-500/30"
        : label === "Awaiting Result"
          ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/30"
          : label === "Ready for Lab"
            ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
            : "bg-muted text-muted-foreground border-border";

  return (
    <Badge
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold",
        className
      )}
    >
      {label}
    </Badge>
  );
}

function collectionStatusLabel(batch: LabBatchSummary) {
  const workflow = batch.supSupTodoWorkflow;

  if (workflow?.pre_lab_result === "FAIL" || workflow?.post_lab_result === "FAIL") {
    return "To dispose";
  }

  if (batch.status === "AVAILABLE") return "Available";
  if (batch.status === "DISPOSED") return "To dispose";
  if (workflow?.post_lab_result === "PASS") return "Available";
  if (workflow?.pre_lab_result === "PASS") return "Passed";
  if (workflow?.pre_sent_to_lab || workflow?.post_sent_to_lab) {
    return "Awaiting Result";
  }
  if (workflow?.cold_chain_started_at) return "Ready for Lab";
  return batch.status === "POOLING" ? "Not Ready" : "Ready for Lab";
}

function formatSearchDate(date: Date) {
  const dateValue = new Date(date);
  return [
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(dateValue),
    dateValue.toISOString().split("T")[0],
  ].join(" ");
}

function collectionSearchText(batch: LabBatchSummary) {
  const workflow = batch.supSupTodoWorkflow;
  const values = [
    batch.batch_code,
    workflow ? `sample ${workflow.sample_no}` : "",
    workflow ? `sample #${workflow.sample_no}` : "",
    workflow ? String(workflow.sample_no) : "",
    batch.donor_name,
    formatSearchDate(batch.pooling_date),
    formatProgram(batch.program),
    batch.program ?? "",
    prePasteurStatus(batch),
    postPasteurStatus(batch),
    collectionStatusLabel(batch),
    batch.status,
    batch.remaining_volume.toString(),
    batch.remaining_volume.toLocaleString(),
    batch.total_volume.toString(),
    batch.total_volume.toLocaleString(),
    batch.pre_pasteurization?.result ?? "",
    batch.post_pasteurization?.result ?? "",
    workflow?.pre_lab_result ?? "",
    workflow?.post_lab_result ?? "",
    workflow?.final_status ?? "",
    workflow?.current_step ?? "",
  ];

  return values.join(" ").toLowerCase();
}

export function BatchTable({
  batches,
  selectedBatchId,
  onSelectBatch,
  selectedIds,
  onSelectionChange,
  onFilteredBatchesChange,
}: BatchTableProps) {
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return batches.filter((batch) => {
      const searchableText = collectionSearchText(batch);
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch === "" || searchableText.includes(normalizedSearch);

      const matchesProgram =
        programFilter === "all" || batch.program === programFilter;

      return matchesSearch && matchesProgram;
    });
  }, [batches, search, programFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    onFilteredBatchesChange?.(filtered);
  }, [filtered, onFilteredBatchesChange]);

  const isAllPageSelected =
    paginated.length > 0 &&
    paginated.every((b) => selectedIds.has(b.batch_id));

  const toggleSelectAll = useCallback(() => {
    onSelectionChange((() => {
      const next = new Set(selectedIds);
      if (isAllPageSelected) {
        for (const b of paginated) next.delete(b.batch_id);
      } else {
        for (const b of paginated) next.add(b.batch_id);
      }
      return next;
    })());
  }, [isAllPageSelected, paginated, selectedIds, onSelectionChange]);

  const toggleSelect = useCallback((batchId: number) => {
    onSelectionChange((() => {
      const next = new Set(selectedIds);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    })());
  }, [selectedIds, onSelectionChange]);

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  return (
    <section className="flex flex-col min-w-0 bg-background border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-border bg-muted flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Active Collections
          </h3>
          <Badge className="bg-muted-foreground/10 text-muted-foreground px-2 py-0.5 text-[10px]">
            {filtered.length}
          </Badge>
          {selectedIds.size > 0 && (
            <Badge className="bg-primary/10 text-primary px-2 py-0.5 text-[10px]">
              {selectedIds.size} selected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search collections..."
              className="h-8 pl-8 text-xs bg-background border-border"
            />
          </div>
          <Select
            value={programFilter}
            onValueChange={(v) => {
              setProgramFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-[130px] bg-background border-border">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="SUPSUP_TODO">Supsup Todo</SelectItem>
              <SelectItem value="MILKY_WAY">Milky Way</SelectItem>
              <SelectItem value="MOMS_ACT">{"Mom's Act"}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-border"
          >
            <Filter className="size-3.5" />
            Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted z-10 border-b border-border">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="w-10 py-2 px-3">
                <Checkbox
                  checked={isAllPageSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Batch ID
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Donor Name
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Date Logged
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Program
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold text-center">
                Pre-Pasteurization
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold text-center">
                Post-Pasteurization
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Status
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold text-right">
                Volume (mL)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((batch) => {
              const isSelected = selectedBatchId === batch.batch_id;
              const isChecked = selectedIds.has(batch.batch_id);
              return (
                <TableRow
                  key={batch.batch_id}
                  onClick={() => onSelectBatch(batch.batch_id)}
                  className={cn(
                    "cursor-pointer transition-colors border-b border-border/50",
                    isSelected
                      ? "bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                >
                  <TableCell className="w-10 py-2.5 px-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSelect(batch.batch_id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select batch ${batch.batch_code}`}
                    />
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-[13px] font-semibold text-primary">
                    {batch.batch_code}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-[13px] text-foreground">
                    {batch.donor_name}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-[13px] text-muted-foreground">
                    {formatDate(batch.pooling_date)}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-[13px] text-foreground">
                    {formatProgram(batch.program)}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-center">
                    <ProcessStatusBadge label={prePasteurStatus(batch)} />
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-center">
                    <ProcessStatusBadge label={postPasteurStatus(batch)} />
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    <ProcessStatusBadge label={collectionStatusLabel(batch)} />
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-[13px] font-semibold text-foreground text-right tabular-nums">
                    {batch.remaining_volume.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  No collections found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-2 border-t border-border bg-muted flex justify-between items-center shrink-0 text-xs text-muted-foreground">
        <span>
          Showing{" "}
          {filtered.length === 0
            ? 0
            : (safePage - 1) * PAGE_SIZE + 1}
          –{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
          collections
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="border-border"
          >
            <ChevronLeft className="size-3" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={safePage === pageNum ? "default" : "outline"}
                size="xs"
                onClick={() => setPage(pageNum)}
                className={cn(
                  "text-xs min-w-[28px]",
                  safePage === pageNum
                    ? "bg-primary text-primary-foreground"
                    : "border-border"
                )}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="border-border"
          >
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>
    </section>
  );
}

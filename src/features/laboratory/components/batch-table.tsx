"use client";

import { useState, useMemo, useCallback } from "react";
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
import { LabResultBadge } from "./lab-result-badge";
import { BatchStatusBadge } from "./batch-status-badge";
import { cn } from "@/core/utils/cn";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import type { LabBatchSummary } from "../queries";

interface BatchTableProps {
  batches: LabBatchSummary[];
  selectedBatchId: number | null;
  onSelectBatch: (batchId: number) => void;
}

const PAGE_SIZE = 15;

function formatProgram(program: string | null): string {
  if (!program) return "--";
  return program
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function BatchTable({
  batches,
  selectedBatchId,
  onSelectBatch,
}: BatchTableProps) {
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    return batches.filter((batch) => {
      const matchesSearch =
        search === "" ||
        batch.batch_code.toLowerCase().includes(search.toLowerCase());

      const matchesProgram =
        programFilter === "all" || batch.program === programFilter;

      return matchesSearch && matchesProgram;
    });
  }, [batches, search, programFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const isAllPageSelected =
    paginated.length > 0 &&
    paginated.every((b) => selectedIds.has(b.batch_id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        for (const b of paginated) next.delete(b.batch_id);
      } else {
        for (const b of paginated) next.add(b.batch_id);
      }
      return next;
    });
  }, [isAllPageSelected, paginated]);

  const toggleSelect = useCallback((batchId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }, []);

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
            Active Batches
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
              placeholder="Search batches..."
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
                Date Logged
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Program
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold text-center">
                Pre-Past.
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold text-center">
                Post-Past.
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
                  <TableCell className="py-2.5 px-3 text-[13px] text-muted-foreground">
                    {formatDate(batch.pooling_date)}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-[13px] text-foreground">
                    {formatProgram(batch.program)}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-center">
                    {batch.pre_pasteurization ? (
                      <LabResultBadge
                        result={
                          batch.pre_pasteurization.result as
                            | "PASS"
                            | "FAIL"
                            | "PENDING"
                        }
                      />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        --
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-center">
                    {batch.post_pasteurization ? (
                      <LabResultBadge
                        result={
                          batch.post_pasteurization.result as
                            | "PASS"
                            | "FAIL"
                            | "PENDING"
                        }
                      />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        --
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 px-3">
                    <BatchStatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-[13px] font-semibold text-foreground text-right tabular-nums">
                    {batch.total_volume.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  No batches found matching your criteria.
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
            : (page - 1) * PAGE_SIZE + 1}
          –{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
          batches
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-border"
          >
            <ChevronLeft className="size-3" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="xs"
                onClick={() => setPage(pageNum)}
                className={cn(
                  "text-xs min-w-[28px]",
                  page === pageNum
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
            disabled={page === totalPages}
            className="border-border"
          >
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>
    </section>
  );
}

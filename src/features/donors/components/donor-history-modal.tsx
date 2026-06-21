"use client";

import { Badge } from "@/core/ui/badge";
import { Button } from "@/core/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/core/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { ProgramBadge } from "./program-badge";
import { formatDonorTrackingNo } from "@/core/utils/tracking";
import { Inbox } from "lucide-react";
import type { DonorDetail } from "../queries";

interface DonorHistoryModalProps {
  donor: DonorDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DonorHistoryModal({
  donor,
  open,
  onOpenChange,
}: DonorHistoryModalProps) {
  function formatDate(date: Date | null) {
    if (!date) return "--";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  function formatDateTime(date: Date | null) {
    if (!date) return "--";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }

  const collections = donor.collections;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">
            Donation History
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Complete collection record for{" "}
            <span className="font-medium text-foreground">
              {donor.first_name} {donor.last_name}
            </span>{" "}
            &mdash; {formatDonorTrackingNo(donor.donor_id)}
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="flex gap-4 shrink-0">
          <div className="bg-muted/50 px-4 py-2 rounded border border-border/50">
            <span className="text-[11px] text-muted-foreground block">
              Total Collections
            </span>
            <span className="text-[16px] font-bold text-primary">
              {collections.length}
            </span>
          </div>
          <div className="bg-muted/50 px-4 py-2 rounded border border-border/50">
            <span className="text-[11px] text-muted-foreground block">
              Total Volume
            </span>
            <span className="text-[16px] font-bold text-primary">
              {donor.total_volume.toLocaleString()}{" "}
              <span className="text-[12px] font-normal text-muted-foreground">
                mL
              </span>
            </span>
          </div>
          <div className="bg-muted/50 px-4 py-2 rounded border border-border/50">
            <span className="text-[11px] text-muted-foreground block">
              First Donation
            </span>
            <span className="text-[16px] font-bold text-foreground">
              {collections.length > 0
                ? formatDate(collections[collections.length - 1].collection_date)
                : "--"}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto rounded border border-border">
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="size-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No drop-off history found</p>
              <p className="text-xs mt-1">
                This donor has not recorded any collections yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    CTN
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Date
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Volume
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Program
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Condition
                  </TableHead>
                  <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Batch
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((c) => (
                  <TableRow
                    key={c.ctn}
                    className="border-b border-border/50 hover:bg-muted/30"
                  >
                    <TableCell className="py-2 px-3 text-[13px] font-medium text-primary">
                      {c.tracking_no ?? `CTN-${c.ctn.toString().padStart(4, "0")}`}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-[13px] text-foreground">
                      {formatDateTime(c.collection_date)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-[13px] font-semibold text-foreground">
                      {c.volume} mL
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <ProgramBadge program={c.program} />
                    </TableCell>
                    <TableCell className="py-2 px-3 text-[13px] text-muted-foreground max-w-[180px] truncate">
                      {c.remarks ?? "--"}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      {c.batch ? (
                        <Badge className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0">
                          {c.batch.batch_code}
                        </Badge>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end shrink-0 pt-1">
          <Button
            variant="outline"
            className="h-8 text-xs border-border"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

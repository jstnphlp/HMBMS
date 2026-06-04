"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { Button } from "@/core/ui/button";
import { cn } from "@/core/utils/cn";
import { ListAlt } from "lucide-react";
import type { DispensingLogEntry } from "../queries";

interface DispensingLogTableProps {
  logs: DispensingLogEntry[];
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function DispensingLogTable({ logs }: DispensingLogTableProps) {
  return (
    <section className="bg-popover border border-border rounded-sm overflow-hidden flex flex-col flex-1">
      {/* Toolbar */}
      <div className="p-4 border-b border-border bg-background flex justify-between items-center">
        <h2 className="text-xs leading-4 font-semibold tracking-wider uppercase text-foreground flex items-center gap-2">
          <ListAlt className="h-4 w-4 text-primary" />
          Dispensing Log
        </h2>
        <Button
          variant="link"
          className="text-primary text-xs h-auto p-0"
        >
          View All
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted hover:bg-muted">
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Date / Time
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Batch ID
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Recipient
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Volume
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Total (₱)
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Dispensed By
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow
                key={log.dis_id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <TableCell className="p-3 text-sm text-foreground">
                  {formatDateTime(log.dispensingDate)}
                </TableCell>
                <TableCell className="p-3">
                  <span className="font-mono text-xs bg-card px-1.5 py-0.5 rounded-sm border border-border">
                    {log.batchCode}
                  </span>
                </TableCell>
                <TableCell className="p-3 text-sm text-foreground">
                  {log.beneficiaryId}
                </TableCell>
                <TableCell className="p-3 text-sm font-semibold text-foreground">
                  {log.volume.toLocaleString()} mL
                </TableCell>
                <TableCell className="p-3 text-sm font-semibold text-foreground">
                  ₱{log.total.toLocaleString()}
                </TableCell>
                <TableCell className="p-3 text-sm text-muted-foreground">
                  {log.dispensedByName}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  No dispensing records yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

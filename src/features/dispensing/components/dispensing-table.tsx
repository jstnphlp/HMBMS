"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { cn } from "@/core/utils/cn";
import { ClipboardList, Search } from "lucide-react";
import type { DispensingLogEntry } from "../queries";

interface DispensingTableProps {
  logs: DispensingLogEntry[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
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

export function DispensingTable({
  logs,
  selectedId,
  onSelect,
}: DispensingTableProps) {
  return (
    <section className="bg-popover border border-border rounded-sm overflow-hidden flex flex-col flex-1">
      <div className="p-4 border-b border-border bg-background flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" />
        <h2 className="text-xs leading-4 font-semibold tracking-wider uppercase text-foreground">
          Dispensing Log
        </h2>
        <span className="text-xs text-muted-foreground ml-auto">
          {logs.length} record{logs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto overflow-y-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted hover:bg-muted">
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Date / Time
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Batch Code
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Beneficiary
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Volume (mL)
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
            {logs.map((log, i) => (
              <TableRow
                key={log.dis_id}
                onClick={() =>
                  onSelect(selectedId === log.dis_id ? null : log.dis_id)
                }
                className={cn(
                  "border-b border-border/50 cursor-pointer transition-colors h-10",
                  i % 2 === 0 ? "bg-background" : "bg-muted/40",
                  selectedId === log.dis_id
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : "hover:bg-muted/50"
                )}
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
                <TableCell colSpan={6} className="py-16">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="mb-2 h-8 w-8" />
                    <p className="text-sm">No records match your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { Badge } from "@/core/ui/badge";
import type { DisposalLogEntry } from "../queries";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const reasonBadgeClass: Record<string, string> = {
  "Positive Lab Culture": "bg-destructive/10 text-destructive border border-destructive/20",
  "Expired Shelf Life": "bg-destructive/10 text-destructive border border-destructive/20",
  "Temperature Excursion": "bg-destructive/10 text-destructive border border-destructive/20",
  "Compromised Packaging": "bg-muted text-muted-foreground border border-border",
  "Donor Medication Flag": "bg-muted text-muted-foreground border border-border",
};

function getReasonBadgeClass(reason: string): string {
  for (const [key, cls] of Object.entries(reasonBadgeClass)) {
    if (reason.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  return "bg-muted text-muted-foreground border border-border";
}

interface DisposalLogsTableProps {
  logs: DisposalLogEntry[];
}

export function DisposalLogsTable({ logs }: DisposalLogsTableProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
        <h3 className="text-xs leading-4 font-semibold tracking-wider text-foreground uppercase">
          Recent Disposals
        </h3>
        <span className="text-xs text-muted-foreground">
          {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
            <TableRow className="border-b border-border hover:bg-muted/80">
              <TableHead className="px-4 text-xs tracking-wider text-muted-foreground uppercase">
                Date & Time
              </TableHead>
              <TableHead className="px-4 text-xs tracking-wider text-muted-foreground uppercase">
                Batch ID
              </TableHead>
              <TableHead className="px-4 text-xs tracking-wider text-muted-foreground uppercase">
                Reason
              </TableHead>
              <TableHead className="px-4 text-right text-xs tracking-wider text-muted-foreground uppercase">
                Vol (mL)
              </TableHead>
              <TableHead className="px-4 text-xs tracking-wider text-muted-foreground uppercase">
                Authorized By
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm">
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No disposal records found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.disposalId}
                  className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50"
                >
                  <TableCell className="px-4 text-muted-foreground">
                    {formatDate(log.disposalDate)}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs font-medium text-foreground">
                    {log.batchCode}
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge
                      variant="outline"
                      className={`rounded-sm px-2 py-0.5 text-[11px] font-semibold ${getReasonBadgeClass(log.reason)}`}
                    >
                      {log.reason}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 text-right font-mono font-medium text-destructive">
                    {log.volume.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {log.disposedByName}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

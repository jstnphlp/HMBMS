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
import { cn } from "@/core/utils/cn";
import type { CollectionLogEntry } from "../queries";

const programLabels: Record<string, string> = {
  SUPSUP_TODO: "Supsup Todo",
  MILKY_WAY: "Milky Way",
  MOMS_ACT: "Mom's Act",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  POOLING: {
    label: "Pooling",
    className: "bg-accent text-foreground border border-border",
  },
  TESTING: {
    label: "Testing",
    className: "bg-secondary/20 text-secondary-foreground",
  },
  PASTEURIZED: {
    label: "Pasteurized",
    className: "bg-primary/10 text-primary",
  },
  AVAILABLE: {
    label: "Available",
    className: "bg-primary/15 text-primary font-semibold",
  },
  DISPOSED: {
    label: "Disposed",
    className: "bg-destructive/10 text-destructive",
  },
  DISPENSED: {
    label: "Dispensed",
    className: "bg-accent text-muted-foreground",
  },
  UNASSIGNED: {
    label: "Unassigned",
    className: "bg-muted text-muted-foreground border border-border",
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CollectionLogsTableProps {
  logs: CollectionLogEntry[];
}

export function CollectionLogsTable({ logs }: CollectionLogsTableProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
        <h3 className="text-xs leading-4 font-semibold tracking-wider text-foreground uppercase">
          Recent Collections
        </h3>
        <span className="text-xs text-muted-foreground">
          {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
            <TableRow className="border-b border-border hover:bg-muted/80">
              <TableHead className="px-4 text-center text-xs tracking-wider text-muted-foreground uppercase">
                CTN
              </TableHead>
              <TableHead className="px-4 text-xs tracking-wider text-muted-foreground uppercase">
                Date / Time
              </TableHead>
              <TableHead className="px-4 text-xs tracking-wider text-muted-foreground uppercase">
                Donor
              </TableHead>
              <TableHead className="px-4 text-xs tracking-wider text-muted-foreground uppercase">
                Program
              </TableHead>
              <TableHead className="px-4 text-right text-xs tracking-wider text-muted-foreground uppercase">
                Vol (mL)
              </TableHead>
              <TableHead className="px-4 text-center text-xs tracking-wider text-muted-foreground uppercase">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm">
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No collection records found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, i) => {
                const status = statusConfig[log.status] ?? statusConfig.UNASSIGNED;
                return (
                  <TableRow
                    key={log.ctn}
                    className={cn(
                      "cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50",
                      i % 2 === 1 && "bg-card"
                    )}
                  >
                    <TableCell className="px-4 text-center font-mono text-xs font-medium text-primary">
                      {log.trackingNo ?? `CTN-${String(log.ctn).padStart(4, "0")}`}
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {formatDate(log.collectionDate)}
                    </TableCell>
                    <TableCell className="px-4">
                      <span className="font-medium text-secondary-foreground">
                        {log.donorId}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {log.donorName}
                      </span>
                    </TableCell>
                    <TableCell className="px-4">
                      {programLabels[log.program] ?? log.program}
                    </TableCell>
                    <TableCell className="px-4 text-right font-mono font-medium">
                      {log.volume.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-sm px-2 py-0.5 text-[11px] font-semibold",
                          status.className
                        )}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

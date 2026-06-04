"use client";

import { useState, useMemo } from "react";
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
import { Badge } from "@/core/ui/badge";
import { cn } from "@/core/utils/cn";
import { Search, UserPlus, Syringe, MoreHorizontal } from "lucide-react";
import type { BeneficiaryEntry } from "../queries";

interface RecipientTableProps {
  beneficiaries: BeneficiaryEntry[];
}

function formatDate(iso: string | null) {
  if (!iso) return "--";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function getStatusBadge(entry: BeneficiaryEntry) {
  if (!entry.lastDispensingDate) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold">
        Pending Allocation
      </span>
    );
  }
  const lastDate = new Date(entry.lastDispensingDate);
  const now = new Date();
  const isToday =
    lastDate.getFullYear() === now.getFullYear() &&
    lastDate.getMonth() === now.getMonth() &&
    lastDate.getDate() === now.getDate();

  if (isToday) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
        Fulfilled Today
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
      Awaiting
    </span>
  );
}

export function RecipientTable({ beneficiaries }: RecipientTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return beneficiaries;
    const q = search.toLowerCase();
    return beneficiaries.filter(
      (b) =>
        b.contact_no.includes(q) ||
        `REC-${String(b.beneficiary_id).padStart(4, "0")}`
          .toLowerCase()
          .includes(q)
    );
  }, [beneficiaries, search]);

  return (
    <section className="bg-popover border border-border rounded-sm overflow-hidden flex flex-col">
      {/* Toolbar — matches Stitch: p-4 border-b bg-surface */}
      <div className="p-4 border-b border-border bg-background flex justify-between items-center">
        <h2 className="text-xs leading-4 font-semibold tracking-wider uppercase text-foreground flex items-center gap-2">
          <Syringe className="h-4 w-4 text-primary" />
          Active Recipients
        </h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter recipients..."
              className="h-8 pl-8 text-xs bg-popover border-border w-48"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs gap-1 bg-amber-100 text-amber-900 hover:bg-amber-200 border-0"
          >
            <UserPlus className="size-3.5" />
            Add Recipient
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted hover:bg-muted">
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Recipient ID
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Contact
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Total Volume
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Status
              </TableHead>
              <TableHead className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow
                key={b.beneficiary_id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <TableCell className="p-3">
                  <div className="font-medium text-primary text-sm">
                    REC-{String(b.beneficiary_id).padStart(4, "0")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {b.remarks || "No remarks"}
                  </div>
                </TableCell>
                <TableCell className="p-3 text-sm text-foreground">
                  {b.contact_no}
                </TableCell>
                <TableCell className="p-3 text-sm font-semibold text-foreground">
                  {b.totalVolume.toLocaleString()} mL
                </TableCell>
                <TableCell className="p-3">{getStatusBadge(b)}</TableCell>
                <TableCell className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  No recipients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

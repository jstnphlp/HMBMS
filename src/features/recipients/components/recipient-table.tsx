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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import { Badge } from "@/core/ui/badge";
import { RecipientStatusBadge, UrgencyBadge } from "./recipient-status-badge";
import { cn } from "@/core/utils/cn";
import { Search, Filter, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import type { RecipientWithStats } from "../queries";

interface RecipientTableProps {
  recipients: RecipientWithStats[];
  selectedRecipientId: number | null;
  onSelectRecipient: (id: number) => void;
  onRegisterNew: () => void;
}

const PAGE_SIZE = 15;

export function RecipientTable({
  recipients,
  selectedRecipientId,
  onSelectRecipient,
  onRegisterNew,
}: RecipientTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return recipients.filter((r) => {
      const matchesSearch =
        search === "" ||
        `REC-${String(r.beneficiary_id).padStart(4, "0")}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.contact_no.includes(search) ||
        (r.remarks ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.dispensing_count > 0) ||
        (statusFilter === "pending" && r.dispensing_count === 0);

      return matchesSearch && matchesStatus;
    });
  }, [recipients, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <section className="flex-[2] min-w-0 flex flex-col bg-surface border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border bg-card flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Recipient Registry
          </h2>
          <Badge className="bg-muted text-muted-foreground px-2 py-0.5 text-[10px]">
            {filtered.length.toLocaleString()}
          </Badge>
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
              placeholder="Search ID or contact..."
              className="h-8 pl-8 text-xs bg-surface border-border"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-[120px] bg-surface border-border">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
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
          <Button
            size="sm"
            className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onRegisterNew}
          >
            <UserPlus className="size-3.5" />
            Register New
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10 border-b border-border shadow-sm">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="py-2 px-4 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Recipient ID
              </TableHead>
              <TableHead className="py-2 px-4 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Name
              </TableHead>
              <TableHead className="py-2 px-4 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Contact
              </TableHead>
              <TableHead className="py-2 px-4 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Remarks
              </TableHead>
              <TableHead className="py-2 px-4 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Status
              </TableHead>
              <TableHead className="py-2 px-4 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold text-right">
                Vol Received (mL)
              </TableHead>
              <TableHead className="py-2 px-4 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold text-right">
                Dispensings
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((recipient, idx) => (
              <TableRow
                key={recipient.beneficiary_id}
                onClick={() => onSelectRecipient(recipient.beneficiary_id)}
                className={cn(
                  "cursor-pointer transition-colors border-b border-border/50",
                  selectedRecipientId === recipient.beneficiary_id
                    ? "bg-primary/5"
                    : idx % 2 === 0
                      ? "bg-surface"
                      : "bg-muted/30",
                  "hover:bg-muted/50"
                )}
              >
                <TableCell className="py-2.5 px-4 text-[13px] font-medium text-primary">
                  REC-{String(recipient.beneficiary_id).padStart(4, "0")}
                </TableCell>
                <TableCell className="py-2.5 px-4 text-[13px] font-medium text-foreground">
                  {recipient.name}
                </TableCell>
                <TableCell className="py-2.5 px-4 text-[13px] font-medium text-foreground">
                  {recipient.contact_no}
                </TableCell>
                <TableCell className="py-2.5 px-4 text-[13px] text-muted-foreground max-w-[200px] truncate">
                  {recipient.remarks || "--"}
                </TableCell>
                <TableCell className="py-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <RecipientStatusBadge
                      hasDispensings={recipient.dispensing_count > 0}
                      lastDispensingDate={recipient.last_dispensing_date}
                      totalVolume={recipient.total_volume}
                    />
                    {recipient.dispensing_count === 0 && (
                      <UrgencyBadge
                        totalVolume={recipient.total_volume}
                        dispensingCount={recipient.dispensing_count}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-4 text-[13px] font-semibold text-foreground text-right">
                  {recipient.total_volume.toLocaleString()}
                </TableCell>
                <TableCell className="py-2.5 px-4 text-[13px] text-muted-foreground text-right">
                  {recipient.dispensing_count}
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  No recipients found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="p-3 border-t border-border bg-card flex justify-between items-center shrink-0">
        <span className="text-xs text-muted-foreground">
          Showing{" "}
          {filtered.length === 0
            ? 0
            : (page - 1) * PAGE_SIZE + 1}
          –{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length} recipients
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-7 w-7 border-border"
          >
            <ChevronLeft className="size-3" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(pageNum)}
                className={cn(
                  "text-xs min-w-[28px] h-7",
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
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-7 w-7 border-border"
          >
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>
    </section>
  );
}

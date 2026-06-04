"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import { DonorStatusBadge } from "./donor-status-badge";
import { DonorRegistrationModal } from "./donor-registration-modal";
import { cn } from "@/core/utils/cn";
import { Search, Filter, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { DonorWithStats } from "../queries";

interface DonorTableProps {
  donors: DonorWithStats[];
  selectedDonorId: number | null;
  onSelectDonor: (donorId: number) => void;
  searchQuery: string;
}

const PAGE_SIZE = 15;

export function DonorTable({
  donors,
  selectedDonorId,
  onSelectDonor,
  searchQuery,
}: DonorTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSearchParam = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set("query", value);
        } else {
          params.delete("query");
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }, 300);
    },
    [searchParams, router, pathname]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const filtered = donors.filter((donor) => {
    const matchesStatus =
      statusFilter === "all" || donor.status === statusFilter;
    return matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  function formatDate(date: Date | null) {
    if (!date) return "--";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  function getInitials(first: string, last: string) {
    return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
  }

  return (
    <>
      <section className="flex-[2] flex flex-col bg-surface border border-border rounded-lg overflow-hidden min-w-[500px]">
        {/* Toolbar */}
        <div className="p-3 border-b border-border bg-card flex justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Donor Registry
          </h2>
          <Badge className="bg-muted text-muted-foreground px-2 py-0.5 text-[10px]">
            {filtered.length.toLocaleString()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setRegistrationOpen(true)}
          >
            <Plus className="size-3.5" />
            Add Donor
          </Button>
          <div className="relative max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
            <Input
              value={localSearch}
              onChange={(e) => {
                const val = e.target.value;
                setLocalSearch(val);
                setPage(1);
                updateSearchParam(val);
              }}
              placeholder="Search donors..."
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
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
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
          <TableHeader className="sticky top-0 bg-card z-10 border-b border-border">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold w-12">
                ID
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Name
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Birthdate
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Address
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Contact No.
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Civil Status
              </TableHead>
              <TableHead className="py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((donor) => (
              <TableRow
                key={donor.donor_id}
                onClick={() => onSelectDonor(donor.donor_id)}
                className={cn(
                  "cursor-pointer transition-colors border-b border-border/50",
                  selectedDonorId === donor.donor_id
                    ? "bg-primary/5"
                    : "hover:bg-muted/50"
                )}
              >
                <TableCell className="py-2.5 px-3 text-[13px] font-medium text-primary">
                  D-{donor.donor_id.toString().padStart(4, "0")}
                </TableCell>
                <TableCell className="py-2.5 px-3 text-[13px] font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-muted text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                      {getInitials(donor.first_name, donor.last_name)}
                    </div>
                    {donor.first_name} {donor.last_name}
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-3 text-[13px] text-muted-foreground">
                  {formatDate(donor.birthdate)}
                </TableCell>
                <TableCell className="py-2.5 px-3 text-[13px] text-muted-foreground max-w-[200px] truncate">
                  {donor.address}
                </TableCell>
                <TableCell className="py-2.5 px-3 text-[13px] text-muted-foreground">
                  {donor.contact_no}
                </TableCell>
                <TableCell className="py-2.5 px-3 text-[13px] text-muted-foreground">
                  {donor.civil_status}
                </TableCell>
                <TableCell className="py-2.5 px-3">
                  <DonorStatusBadge status={donor.status} />
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  No donors found matching your criteria.
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
          {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
          donors
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
      <DonorRegistrationModal
        open={registrationOpen}
        onOpenChange={setRegistrationOpen}
      />
    </>
  );
}

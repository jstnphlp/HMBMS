"use client";

import { useState, useTransition } from "react";
import type { ElementType } from "react";
import { toast } from "sonner";
import {
  ClipboardList,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/core/ui/badge";
import { Button } from "@/core/ui/button";
import { Checkbox } from "@/core/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/ui/dialog";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/ui/tabs";
import { Textarea } from "@/core/ui/textarea";
import { allocateMilk, cancelMilkRequest, releaseMilk } from "../actions";
import type {
  AvailableMilkSource,
  DispensingLogbookEntry,
  DistributionData,
  DistributionRequest,
} from "../queries";

type DistributionPageContentProps = {
  data: DistributionData;
};

function formatDate(iso: string | null) {
  if (!iso) return "--";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function statusClass(status: string) {
  if (["DRAFT", "INCOMPLETE"].includes(status)) return "bg-muted text-muted-foreground";
  if (status === "QUEUED") return "bg-amber-100 text-amber-900";
  if (status === "READY_FOR_RELEASE") return "bg-blue-100 text-blue-900";
  if (status === "PARTIALLY_FULFILLED") return "bg-orange-100 text-orange-900";
  if (status === "RELEASED") return "bg-green-100 text-green-900";
  if (status === "CANCELLED") return "bg-destructive/10 text-destructive";
  if (status === "UNPAID") return "bg-amber-100 text-amber-900";
  if (status === "PAID") return "bg-green-100 text-green-900";
  return "bg-muted text-muted-foreground";
}

function firstError(result: { errors?: unknown }) {
  const errors = result.errors as Record<string, string[]> | undefined;
  return Object.values(errors ?? {}).flat()[0] ?? "Request failed.";
}

function matchesRequest(request: DistributionRequest, query: string) {
  if (!query) return true;
  const haystack = [
    request.request_no,
    request.recipient_name,
    request.beneficiary_name,
    request.priority,
    request.status,
    request.payment_status,
    ...request.source_ctns,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function AllocationDialog({
  request,
  sources,
  open,
  onOpenChange,
}: {
  request: DistributionRequest | null;
  sources: AvailableMilkSource[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [rows, setRows] = useState([{ batch_id: "", volume: "" }]);
  const [isPending, startTransition] = useTransition();

  if (!request) return null;
  const currentRequest = request;

  const allocated = rows.reduce((sum, row) => sum + (Number(row.volume) || 0), 0);

  function handleSubmit() {
    startTransition(async () => {
      const result = await allocateMilk({
        request_id: currentRequest.request_id,
        allocations: rows
          .filter((row) => row.batch_id && Number(row.volume) > 0)
          .map((row) => ({
            batch_id: Number(row.batch_id),
            volume: Number(row.volume),
          })),
      });

      if (result.success) {
        toast.success("Milk allocated.");
        setRows([{ batch_id: "", volume: "" }]);
        onOpenChange(false);
      } else {
        toast.error(firstError(result));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate Milk</DialogTitle>
          <DialogDescription>
            {currentRequest.request_no} needs {currentRequest.requested_volume.toLocaleString()} mL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {rows.map((row, index) => {
            const source = sources.find((item) => item.batch_id.toString() === row.batch_id);
            return (
              <div key={index} className="grid gap-3 md:grid-cols-[1fr_140px_40px]">
                <div>
                  <Label>Available source</Label>
                  <Select
                    value={row.batch_id}
                    onValueChange={(value) =>
                      setRows((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, batch_id: value } : item
                        )
                      )
                    }
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select CTN/batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((sourceItem) => (
                        <SelectItem key={sourceItem.batch_id} value={sourceItem.batch_id.toString()}>
                          {sourceItem.source_label} - {sourceItem.available_vol.toLocaleString()} mL
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {source && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expires {formatDate(source.expiration_date)}; available {source.available_vol.toLocaleString()} mL
                    </p>
                  )}
                </div>
                <div>
                  <Label>Volume (mL)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={row.volume}
                    onChange={(event) =>
                      setRows((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, volume: event.target.value }
                            : item
                        )
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setRows((current) =>
                        current.length === 1
                          ? [{ batch_id: "", volume: "" }]
                          : current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                  >
                    <XCircle className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-sm border border-border bg-muted/40 p-3 text-sm">
          Allocating {allocated.toLocaleString()} mL of {currentRequest.requested_volume.toLocaleString()} mL requested.
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRows((current) => [...current, { batch_id: "", volume: "" }])}
          >
            Add Source
          </Button>
          <Button disabled={isPending || allocated <= 0} onClick={handleSubmit}>
            {isPending ? "Allocating..." : "Save Allocation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReleaseDialog({
  request,
  open,
  onOpenChange,
}: {
  request: DistributionRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!request) return null;

  return (
    <ReleaseDialogContent
      key={request.request_id}
      request={request}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

function ReleaseDialogContent({
  request,
  open,
  onOpenChange,
}: {
  request: DistributionRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [allowPartialRelease, setAllowPartialRelease] = useState(false);
  const [remarks, setRemarks] = useState(request.remarks ?? "");
  const [paymentStatus, setPaymentStatus] = useState(request.payment_status);
  const [depositAmount, setDepositAmount] = useState(
    request.deposit_amount?.toString() ?? ""
  );
  const [pricePerMl, setPricePerMl] = useState(
    request.price_per_ml?.toString() ?? ""
  );
  const [amountPaid, setAmountPaid] = useState(
    request.amount_paid?.toString() ?? ""
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState(request.payment_notes ?? "");
  const [isPending, startTransition] = useTransition();

  const currentRequest = request;
  const isPartial = currentRequest.allocated_volume < currentRequest.requested_volume;
  const numericPrice = pricePerMl === "" ? undefined : Number(pricePerMl);
  const numericPaid = amountPaid === "" ? undefined : Number(amountPaid);
  const totalAmount =
    numericPrice === undefined ? 0 : numericPrice * currentRequest.allocated_volume;
  const changeAmount =
    numericPaid === undefined ? 0 : Math.max(0, numericPaid - totalAmount);

  function handleRelease() {
    startTransition(async () => {
      const result = await releaseMilk({
        request_id: currentRequest.request_id,
        allow_partial_release: allowPartialRelease,
        payment_status: paymentStatus,
        deposit_amount: depositAmount,
        price_per_ml: pricePerMl,
        amount_paid: amountPaid,
        payment_method: paymentMethod,
        payment_notes: paymentNotes,
        remarks,
      });

      if (result.success) {
        toast.success("Milk released and logged.");
        setRemarks("");
        setAllowPartialRelease(false);
        setDepositAmount("");
        setPricePerMl("");
        setAmountPaid("");
        setPaymentNotes("");
        onOpenChange(false);
      } else {
        toast.error(firstError(result));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-4rem)] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-12">
          <DialogTitle>Release Milk</DialogTitle>
          <DialogDescription>
            Release {currentRequest.allocated_volume.toLocaleString()} mL for {currentRequest.request_no}.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-sm border border-border p-3">
              <div className="text-xs text-muted-foreground">Recipient</div>
              <div className="font-medium">{currentRequest.recipient_name}</div>
            </div>
            <div className="rounded-sm border border-border p-3">
              <div className="text-xs text-muted-foreground">Payment</div>
              <Badge className={statusClass(paymentStatus)}>
                {paymentStatus.replaceAll("_", " ")}
              </Badge>
            </div>
          </div>
          <section className="space-y-4 rounded-sm border border-border p-4">
            <div className="text-sm font-semibold">Payment details</div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="release_payment_status">Payment status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger id="release_payment_status" className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_REQUIRED">Not required</SelectItem>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="WAIVED">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="release_deposit_amount">Deposit amount</Label>
                <Input
                  id="release_deposit_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="release_price_per_ml">Price per mL</Label>
                <Input
                  id="release_price_per_ml"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerMl}
                  onChange={(event) => setPricePerMl(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Total amount</Label>
                <Input
                  value={numericPrice === undefined ? "" : totalAmount.toFixed(2)}
                  readOnly
                  className="mt-1 bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="release_amount_paid">Amount paid</Label>
                <Input
                  id="release_amount_paid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Change</Label>
                <Input
                  value={numericPaid === undefined ? "" : changeAmount.toFixed(2)}
                  readOnly
                  className="mt-1 bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="release_payment_method">Payment method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="release_payment_method" className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="GCash">GCash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="release_payment_notes">Payment notes</Label>
                <Textarea
                  id="release_payment_notes"
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            {paymentStatus === "UNPAID" && (
              <p className="text-sm text-destructive">
                Payment is unpaid. Mark as paid, waived, or not required before releasing milk.
              </p>
            )}
          </section>
          <div>
            <Label>Source CTN(s)</Label>
            <div className="mt-1 rounded-sm border border-border p-3 text-sm">
              {currentRequest.source_ctns.length ? currentRequest.source_ctns.join(", ") : "--"}
            </div>
          </div>
          {isPartial && (
            <label className="flex items-center gap-2 rounded-sm border border-border p-3 text-sm">
              <Checkbox
                checked={allowPartialRelease}
                onCheckedChange={(checked) => setAllowPartialRelease(checked === true)}
              />
              Confirm partial fulfillment release
            </label>
          )}
          <div>
            <Label htmlFor="release_remarks">Remarks</Label>
            <Textarea
              id="release_remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter className="shrink-0 border-t border-border bg-background px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isPending || (isPartial && !allowPartialRelease)}
            onClick={handleRelease}
          >
            {isPending ? "Releasing..." : "Release Milk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({
  request,
  open,
  onOpenChange,
}: {
  request: DistributionRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!request) return null;
  const currentRequest = request;

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelMilkRequest({
        request_id: currentRequest.request_id,
        cancellation_reason: reason,
      });

      if (result.success) {
        toast.success("Request cancelled.");
        setReason("");
        onOpenChange(false);
      } else {
        toast.error(firstError(result));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Request</DialogTitle>
          <DialogDescription>{currentRequest.request_no}</DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="cancel_reason">Reason / remarks</Label>
          <Textarea
            id="cancel_reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="destructive" disabled={isPending || !reason.trim()} onClick={handleCancel}>
            {isPending ? "Cancelling..." : "Cancel Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestTable({
  rows,
  mode,
  onAllocate,
  onRelease,
  onCancel,
}: {
  rows: DistributionRequest[];
  mode: "queue" | "ready" | "cancelled";
  onAllocate?: (request: DistributionRequest) => void;
  onRelease?: (request: DistributionRequest) => void;
  onCancel?: (request: DistributionRequest) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-sm border border-border bg-popover">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead>Request No.</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Beneficiary</TableHead>
            <TableHead>{mode === "ready" ? "Allocated Volume" : "Requested Volume"}</TableHead>
            {mode !== "cancelled" && <TableHead>Priority</TableHead>}
            {mode === "ready" && <TableHead>Payment Status</TableHead>}
            {mode === "cancelled" && <TableHead>Cancelled Date</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((request) => (
            <TableRow key={request.request_id}>
              <TableCell className="font-mono text-xs">{request.request_no}</TableCell>
              <TableCell>{request.recipient_name}</TableCell>
              <TableCell>{request.beneficiary_name}</TableCell>
              <TableCell>
                {(mode === "ready" ? request.allocated_volume : request.requested_volume).toLocaleString()} mL
              </TableCell>
              {mode !== "cancelled" && <TableCell>{request.priority}</TableCell>}
              {mode === "ready" && (
                <TableCell>
                  <Badge className={statusClass(request.payment_status)}>
                    {request.payment_status.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
              )}
              {mode === "cancelled" && <TableCell>{formatDate(request.released_at)}</TableCell>}
              <TableCell>
                <Badge className={statusClass(request.status)}>
                  {request.status.replaceAll("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {mode === "queue" && (
                    <Button size="sm" variant="outline" onClick={() => onAllocate?.(request)}>
                      Allocate Milk
                    </Button>
                  )}
                  {mode === "ready" && (
                    <Button size="sm" onClick={() => onRelease?.(request)}>
                      Release Milk
                    </Button>
                  )}
                  {mode !== "cancelled" && (
                    <Button size="sm" variant="ghost" onClick={() => onCancel?.(request)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ReleasedTable({ rows }: { rows: DispensingLogbookEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-border bg-popover">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead>Dispensing No.</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Beneficiary</TableHead>
            <TableHead>Volume Released</TableHead>
            <TableHead>Source CTN(s)</TableHead>
            <TableHead>Released By</TableHead>
            <TableHead>Release Date</TableHead>
            <TableHead>Payment Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.request_id}-${row.dispensing_id ?? "request"}`}>
              <TableCell className="font-mono text-xs">
                {row.dispensing_id ? `DIS-${String(row.dispensing_id).padStart(4, "0")}` : "--"}
              </TableCell>
              <TableCell>{row.recipient_name}</TableCell>
              <TableCell>{row.beneficiary_name}</TableCell>
              <TableCell>{row.volume_released.toLocaleString()} mL</TableCell>
              <TableCell>{row.source_ctns.join(", ") || "--"}</TableCell>
              <TableCell>{row.released_by ?? "--"}</TableCell>
              <TableCell>{formatDate(row.release_date)}</TableCell>
              <TableCell>
                <Badge className={statusClass(row.payment_status)}>
                  {row.payment_status.replaceAll("_", " ")}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                No released records yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function DistributionPageContent({ data }: DistributionPageContentProps) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [allocationTarget, setAllocationTarget] = useState<DistributionRequest | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<DistributionRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<DistributionRequest | null>(null);
  const metricCards: { label: string; value: number; Icon: ElementType }[] = [
    { label: "Queued", value: data.queue.length, Icon: ClipboardList },
    { label: "Ready", value: data.ready.length, Icon: Truck },
    { label: "Released", value: data.released.length, Icon: Truck },
    { label: "Cancelled", value: data.cancelled.length, Icon: XCircle },
  ];

  const q = search.trim().toLowerCase();
  const filterRows = (rows: DistributionRequest[]) =>
    rows.filter((request) => {
      const matchesFilters =
        (priorityFilter === "ALL" || request.priority === priorityFilter) &&
        (statusFilter === "ALL" || request.status === statusFilter) &&
        (paymentFilter === "ALL" || request.payment_status === paymentFilter);
      return matchesFilters && matchesRequest(request, q);
    });

  const queue = filterRows(data.queue);
  const ready = filterRows(data.ready);
  const released = filterRows(data.released).map(
    (row) => row as DispensingLogbookEntry
  );
  const cancelled = filterRows(data.cancelled);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Distribution</h1>
        <p className="text-sm text-muted-foreground">
          Manage the milk request queue, allocation, release, and dispensing logbook.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {metricCards.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              {label}
              <Icon className="size-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-sm border border-border bg-popover p-4 lg:grid-cols-[1fr_160px_180px_180px]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search request, recipient, beneficiary, priority, CTN..."
            className="pl-8"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
            <SelectItem value="READY_FOR_RELEASE">Ready</SelectItem>
            <SelectItem value="PARTIALLY_FULFILLED">Partial</SelectItem>
            <SelectItem value="RELEASED">Released</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All payments</SelectItem>
            <SelectItem value="NOT_REQUIRED">Not required</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="WAIVED">Waived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="ready">Ready for Release</TabsTrigger>
          <TabsTrigger value="released">Released / Logbook</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="queue">
          <RequestTable
            rows={queue}
            mode="queue"
            onAllocate={setAllocationTarget}
            onCancel={setCancelTarget}
          />
        </TabsContent>
        <TabsContent value="ready">
          <RequestTable
            rows={ready}
            mode="ready"
            onRelease={setReleaseTarget}
            onCancel={setCancelTarget}
          />
        </TabsContent>
        <TabsContent value="released">
          <ReleasedTable rows={released} />
        </TabsContent>
        <TabsContent value="cancelled">
          <RequestTable rows={cancelled} mode="cancelled" />
        </TabsContent>
      </Tabs>

      <AllocationDialog
        request={allocationTarget}
        sources={data.sources}
        open={!!allocationTarget}
        onOpenChange={(open) => {
          if (!open) setAllocationTarget(null);
        }}
      />
      <ReleaseDialog
        request={releaseTarget}
        open={!!releaseTarget}
        onOpenChange={(open) => {
          if (!open) setReleaseTarget(null);
        }}
      />
      <CancelDialog
        request={cancelTarget}
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      />
    </div>
  );
}

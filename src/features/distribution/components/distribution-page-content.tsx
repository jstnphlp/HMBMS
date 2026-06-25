"use client";

import { useState, useTransition } from "react";
import type { ElementType, ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import { CreateRequestDialog } from "@/features/recipients/components/recipients-page-content";
import { allocateMilk, cancelMilkRequest, releaseMilk, resendMilkReadySms } from "../actions";
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
  const [selectedVolumes, setSelectedVolumes] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();

  if (!request) return null;
  const currentRequest = request;

  const requestedVolume = currentRequest.requested_volume - currentRequest.released_volume;
  const selectedAllocations = sources
    .map((source) => ({
      source,
      volume: Number(selectedVolumes[source.batch_id]) || 0,
    }))
    .filter((item) => item.volume > 0);
  const allocated = selectedAllocations.reduce((sum, item) => sum + item.volume, 0);
  const remaining = Math.max(0, requestedVolume - allocated);
  const hasOverAllocated = allocated > requestedVolume;
  const hasSourceOverage = selectedAllocations.some(
    ({ source, volume }) => volume > source.available_vol
  );
  const canSave = allocated > 0 && !hasOverAllocated && !hasSourceOverage;

  function setSourceVolume(source: AvailableMilkSource, value: string) {
    setSelectedVolumes((current) => {
      const next = { ...current };
      const volume = Number(value);

      if (value === "" || Number.isNaN(volume) || volume <= 0) {
        delete next[source.batch_id];
      } else {
        next[source.batch_id] = value;
      }

      return next;
    });
  }

  function toggleSource(source: AvailableMilkSource, checked: boolean) {
    setSelectedVolumes((current) => {
      const next = { ...current };
      if (!checked) {
        delete next[source.batch_id];
        return next;
      }

      const defaultVolume = Math.min(source.available_vol, Math.max(1, remaining || requestedVolume));
      next[source.batch_id] = String(defaultVolume);
      return next;
    });
  }

  function handleSubmit() {
    if (!canSave) {
      toast.error("Review allocated volumes before saving.");
      return;
    }

    startTransition(async () => {
      const result = await allocateMilk({
        request_id: currentRequest.request_id,
        allocations: selectedAllocations.map(({ source, volume }) => ({
          batch_id: source.batch_id,
          volume,
        })),
      });

      if (result.success) {
        if (result.warning) {
          toast.warning(result.message);
        } else {
          toast.success(result.message ?? "Milk allocated successfully.");
        }
        setSelectedVolumes({});
        onOpenChange(false);
      } else {
        toast.error(firstError(result));
      }
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setSelectedVolumes({});
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-4rem)] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-12">
          <DialogTitle>Allocate Milk</DialogTitle>
          <DialogDescription>
            Fulfill {currentRequest.request_no} for {currentRequest.beneficiary_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <div className="rounded-sm border border-border p-3">
              <div className="text-xs text-muted-foreground">Recipient</div>
              <div className="font-medium">{currentRequest.recipient_name}</div>
            </div>
            <div className="rounded-sm border border-border p-3">
              <div className="text-xs text-muted-foreground">Requested</div>
              <div className="font-medium">{requestedVolume.toLocaleString()} mL</div>
            </div>
            <div className="rounded-sm border border-border p-3">
              <div className="text-xs text-muted-foreground">Selected</div>
              <div className="font-medium">{allocated.toLocaleString()} mL</div>
            </div>
            <div className="rounded-sm border border-border p-3">
              <div className="text-xs text-muted-foreground">Remaining</div>
              <div className="font-medium">{remaining.toLocaleString()} mL</div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-sm border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Record / CTN</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Collection / Processing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-36">Allocate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => {
                  const selected = selectedVolumes[source.batch_id] !== undefined;
                  const volume = selectedVolumes[source.batch_id] ?? "";
                  const volumeNumber = Number(volume) || 0;
                  const invalid = volumeNumber > source.available_vol;

                  return (
                    <TableRow
                      key={source.batch_id}
                      className={selected ? "bg-muted/40" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) =>
                            toggleSource(source, checked === true)
                          }
                          aria-label={`Select ${source.source_label}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{source.record_id}</TableCell>
                      <TableCell>{source.batch_code}</TableCell>
                      <TableCell>{source.program.replaceAll("_", " ")}</TableCell>
                      <TableCell>{source.donor_name ?? "--"}</TableCell>
                      <TableCell>{source.available_vol.toLocaleString()} mL</TableCell>
                      <TableCell>
                        <div>{formatDate(source.collection_date)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(source.processing_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusClass(source.status)}>
                          {source.status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          max={source.available_vol}
                          step="1"
                          value={volume}
                          disabled={!selected}
                          onChange={(event) => setSourceVolume(source, event.target.value)}
                          className={invalid ? "border-destructive" : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {sources.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      No eligible milk sources are currently available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {(hasOverAllocated || hasSourceOverage) && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {hasOverAllocated
                ? "Total allocation exceeds this request."
                : "One or more source allocations exceed available volume."}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-background px-6 py-4">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isPending || !canSave} onClick={handleSubmit}>
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

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-sm border border-border bg-muted/20 p-3 text-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value || "--"}</div>
    </div>
  );
}

function ReadOnlyRequestDialog({
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-4rem)] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-12">
          <DialogTitle>Milk Request Details</DialogTitle>
          <DialogDescription>
            {request.request_no} - {request.status.replaceAll("_", " ")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <section className="grid gap-3 md:grid-cols-3">
            <ReadOnlyField label="Recipient" value={request.recipient_name} />
            <ReadOnlyField label="Beneficiary" value={request.beneficiary_name} />
            <ReadOnlyField
              label="Status"
              value={
                <Badge className={statusClass(request.status)}>
                  {request.status.replaceAll("_", " ")}
                </Badge>
              }
            />
            <ReadOnlyField
              label="Requested Volume"
              value={`${request.requested_volume.toLocaleString()} mL`}
            />
            <ReadOnlyField
              label="Allocated Volume"
              value={`${request.allocated_volume.toLocaleString()} mL`}
            />
            <ReadOnlyField
              label="Released Volume"
              value={`${request.released_volume.toLocaleString()} mL`}
            />
            <ReadOnlyField label="Priority" value={request.priority} />
            <ReadOnlyField
              label="Payment"
              value={
                <Badge className={statusClass(request.payment_status)}>
                  {request.payment_status.replaceAll("_", " ")}
                </Badge>
              }
            />
            <ReadOnlyField label="SMS" value={request.sms_status} />
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <ReadOnlyField label="Needed By" value={formatDate(request.needed_by)} />
            <ReadOnlyField label="Created" value={formatDate(request.created_at)} />
            <ReadOnlyField label="Released" value={formatDate(request.released_at)} />
            <ReadOnlyField label="Cancelled" value={formatDate(request.cancelled_at)} />
            <ReadOnlyField label="Released By" value={request.released_by ?? "--"} />
          </section>

          <section className="space-y-3">
            <ReadOnlyField
              label="Source CTN(s)"
              value={request.source_ctns.join(", ") || "--"}
            />
            <ReadOnlyField label="Reason" value={request.request_detail.reason} />
            <ReadOnlyField label="Remarks" value={request.remarks ?? "--"} />
            {request.request_detail.cancellation_reason && (
              <ReadOnlyField
                label="Cancellation Reason"
                value={request.request_detail.cancellation_reason}
              />
            )}
          </section>
        </div>
        <DialogFooter className="shrink-0 border-t border-border bg-background px-6 py-4">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
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
  onResendSms,
  resendingRequestId,
  onCancel,
  onOpenRequest,
}: {
  rows: DistributionRequest[];
  mode: "queue" | "ready" | "cancelled";
  onAllocate?: (request: DistributionRequest) => void;
  onRelease?: (request: DistributionRequest) => void;
  onResendSms?: (request: DistributionRequest) => void;
  resendingRequestId?: number | null;
  onCancel?: (request: DistributionRequest) => void;
  onOpenRequest: (request: DistributionRequest) => void;
}) {
  const emptyColSpan = mode === "ready" ? 9 : 8;

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
            {mode === "ready" && <TableHead>SMS</TableHead>}
            {mode === "cancelled" && <TableHead>Cancelled Date</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((request) => (
            <TableRow
              key={request.request_id}
              className="cursor-pointer"
              onClick={() => onOpenRequest(request)}
            >
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
              {mode === "ready" && <TableCell>{request.sms_status}</TableCell>}
              {mode === "cancelled" && <TableCell>{formatDate(request.cancelled_at)}</TableCell>}
              <TableCell>
                <Badge className={statusClass(request.status)}>
                  {request.status.replaceAll("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {mode === "queue" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAllocate?.(request);
                      }}
                    >
                      Allocate Milk
                    </Button>
                  )}
                  {mode === "ready" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resendingRequestId === request.request_id}
                        onClick={(event) => {
                          event.stopPropagation();
                          onResendSms?.(request);
                        }}
                      >
                        {resendingRequestId === request.request_id ? "Sending..." : "Resend SMS"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRelease?.(request);
                        }}
                      >
                        Release Milk
                      </Button>
                    </>
                  )}
                  {mode !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCancel?.(request);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={emptyColSpan} className="py-12 text-center text-muted-foreground">
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ReleasedTable({
  rows,
  onOpenRequest,
}: {
  rows: DispensingLogbookEntry[];
  onOpenRequest: (request: DistributionRequest) => void;
}) {
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
            <TableRow
              key={`${row.request_id}-${row.dispensing_id ?? "request"}`}
              className="cursor-pointer"
              onClick={() => onOpenRequest(row)}
            >
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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [allocationTarget, setAllocationTarget] = useState<DistributionRequest | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<DistributionRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<DistributionRequest | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<DistributionRequest | null>(null);
  const [readOnlyDetailsTarget, setReadOnlyDetailsTarget] = useState<DistributionRequest | null>(null);
  const [resendingRequestId, setResendingRequestId] = useState<number | null>(null);
  const [isResendPending, startResendTransition] = useTransition();
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

  function handleResendSms(request: DistributionRequest) {
    setResendingRequestId(request.request_id);
    startResendTransition(async () => {
      const result = await resendMilkReadySms(request.request_id);
      if (result.success) {
        toast.success("SMS notification sent.");
        router.refresh();
      } else {
        toast.error(firstError(result));
      }
      setResendingRequestId(null);
    });
  }

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
            onOpenRequest={setDetailsTarget}
          />
        </TabsContent>
        <TabsContent value="ready">
          <RequestTable
            rows={ready}
            mode="ready"
            onRelease={setReleaseTarget}
            onResendSms={handleResendSms}
            resendingRequestId={isResendPending ? resendingRequestId : null}
            onCancel={setCancelTarget}
            onOpenRequest={setReadOnlyDetailsTarget}
          />
        </TabsContent>
        <TabsContent value="released">
          <ReleasedTable rows={released} onOpenRequest={setReadOnlyDetailsTarget} />
        </TabsContent>
        <TabsContent value="cancelled">
          <RequestTable
            rows={cancelled}
            mode="cancelled"
            onOpenRequest={setReadOnlyDetailsTarget}
          />
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
      <CreateRequestDialog
        recipient={detailsTarget?.recipient_detail ?? null}
        request={detailsTarget?.request_detail ?? null}
        open={!!detailsTarget}
        onOpenChange={(open) => {
          if (!open) setDetailsTarget(null);
        }}
      />
      <ReadOnlyRequestDialog
        request={readOnlyDetailsTarget}
        open={!!readOnlyDetailsTarget}
        onOpenChange={(open) => {
          if (!open) setReadOnlyDetailsTarget(null);
        }}
      />
    </div>
  );
}

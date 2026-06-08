"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import { cn } from "@/core/utils/cn";
import {
  CheckCircle,
  Info,
  Truck,
  Printer,
  X,
} from "lucide-react";
import { recordDispensing } from "../actions";
import { toast } from "sonner";
import type {
  DispensingLogEntry,
  AvailableBatch,
  BeneficiaryEntry,
} from "../queries";

interface DispensingDetailPanelProps {
  selectedDispensing: DispensingLogEntry | null;
  batches: AvailableBatch[];
  beneficiaries: BeneficiaryEntry[];
  dispensedBy: number;
  onClose: () => void;
}

const PRICE_PER_ML = 2;

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function DetailView({
  dispensing,
  onClose,
}: {
  dispensing: DispensingLogEntry;
  onClose: () => void;
}) {
  return (
    <div className="bg-background border border-border rounded-lg flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted flex justify-between items-start shrink-0">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Dispensing Detail
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDateTime(dispensing.dispensingDate)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          className="text-muted-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Batch Code
            </span>
            <span className="font-mono text-xs bg-card px-1.5 py-0.5 rounded-sm border border-border">
              {dispensing.batchCode}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Beneficiary
            </span>
            <span className="text-sm font-medium text-foreground">
              {dispensing.beneficiaryId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Contact
            </span>
            <span className="text-sm text-foreground">
              {dispensing.beneficiaryContact}
            </span>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Volume
            </span>
            <span className="text-sm font-semibold text-foreground">
              {dispensing.volume.toLocaleString()} mL
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Price per mL
            </span>
            <span className="text-sm text-foreground">
              ₱{dispensing.price.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total
            </span>
            <span className="text-base font-bold text-foreground">
              ₱{dispensing.total.toLocaleString()}
            </span>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Dispensed By
            </span>
            <span className="text-sm text-muted-foreground">
              {dispensing.dispensedByName}
            </span>
          </div>

          {dispensing.remarks && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                Remarks
              </span>
              <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded-md border border-border/50">
                &ldquo;{dispensing.remarks}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border bg-muted flex gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs border-border"
          onClick={onClose}
        >
          Close
        </Button>
        <Button
          size="sm"
          disabled
          className="flex-1 text-xs gap-1.5"
          title="TODO: Implement receipt printing"
        >
          <Printer className="size-3.5" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
}

function CreateDispenseForm({
  batches,
  beneficiaries,
  dispensedBy,
}: {
  batches: AvailableBatch[];
  beneficiaries: BeneficiaryEntry[];
  dispensedBy: number;
}) {
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [volume, setVolume] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedBatch = useMemo(
    () => batches.find((b) => b.batch_id.toString() === selectedBatchId),
    [batches, selectedBatchId]
  );

  const volumeNum = Number(volume) || 0;
  const totalCost = volumeNum * PRICE_PER_ML;
  const exceedsAvailable = selectedBatch
    ? volumeNum > selectedBatch.available_vol
    : false;

  function handleSubmit() {
    if (!selectedBeneficiary || !selectedBatchId || !volumeNum) return;

    startTransition(async () => {
      const result = await recordDispensing({
        batch_id: Number(selectedBatchId),
        beneficiary_id: Number(selectedBeneficiary),
        dispensed_by: dispensedBy,
        volume: volumeNum,
        price: PRICE_PER_ML,
        remarks: remarks || undefined,
      });

      if (result.success) {
        toast.success("Dispensing recorded successfully.");
        setSelectedBeneficiary("");
        setSelectedBatchId("");
        setVolume("");
        setRemarks("");
      } else {
        const errors = result.errors as Record<string, string[]>;
        const firstError = errors
          ? Object.values(errors).flat()[0]
          : "An error occurred";
        toast.error(firstError ?? "Failed to record dispensing");
      }
    });
  }

  return (
    <div className="bg-background border border-border rounded-lg flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-sm bg-primary text-primary-foreground flex items-center justify-center">
          <Truck className="size-3.5" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Record Dispensing</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Beneficiary
          </Label>
          <Select
            value={selectedBeneficiary}
            onValueChange={setSelectedBeneficiary}
          >
            <SelectTrigger className="mt-1.5 h-9 text-xs bg-background border-border w-full">
              <SelectValue placeholder="Select beneficiary..." />
            </SelectTrigger>
            <SelectContent>
              {beneficiaries.map((b) => (
                <SelectItem
                  key={b.beneficiary_id}
                  value={b.beneficiary_id.toString()}
                >
                  REC-{String(b.beneficiary_id).padStart(4, "0")} —{" "}
                  {b.contact_no}
                </SelectItem>
              ))}
              {beneficiaries.length === 0 && (
                <SelectItem value="none" disabled>
                  No recipients registered
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Batch
          </Label>
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger className="mt-1.5 h-9 text-xs bg-background border-border w-full font-mono">
              <SelectValue placeholder="Select batch..." />
            </SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem
                  key={b.batch_id}
                  value={b.batch_id.toString()}
                >
                  {b.batch_code} — {b.available_vol.toLocaleString()} mL
                </SelectItem>
              ))}
              {batches.length === 0 && (
                <SelectItem value="none" disabled>
                  No available batches
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {selectedBatch && (
            <div className="mt-1.5 p-2 bg-muted border border-border rounded-sm text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info className="text-primary size-3.5 shrink-0" />
              {selectedBatch.available_vol.toLocaleString()} mL available
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Volume (mL)
            </Label>
            <Input
              type="number"
              min={0}
              step={10}
              placeholder="0"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className={cn(
                "mt-1.5 h-9 text-xs bg-background border-border",
                exceedsAvailable &&
                  "border-destructive focus:ring-destructive"
              )}
            />
            {exceedsAvailable && (
              <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                <Info className="size-3" />
                Exceeds available
              </p>
            )}
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Price (₱/mL)
            </Label>
            <Input
              type="number"
              value={PRICE_PER_ML}
              disabled
              className="mt-1.5 h-9 text-xs bg-muted border-border text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Remarks (optional)
          </Label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Add notes..."
            className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-sm text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
          />
        </div>

        {volumeNum > 0 && (
          <div className="p-3 bg-muted border border-border rounded-sm space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Rate</span>
              <span>₱{PRICE_PER_ML}/mL</span>
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Volume</span>
              <span>{volumeNum.toLocaleString()} mL</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border">
              <span>Total</span>
              <span>₱{totalCost.toLocaleString()}.00</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border bg-muted shrink-0">
        <Button
          disabled={
            isPending ||
            !selectedBeneficiary ||
            !selectedBatchId ||
            !volumeNum ||
            exceedsAvailable
          }
          onClick={handleSubmit}
          className="w-full h-9 text-xs gap-1.5 font-semibold uppercase tracking-wider"
        >
          <CheckCircle className="size-3.5" />
          {isPending ? "Processing..." : "Confirm Dispensing"}
        </Button>
      </div>
    </div>
  );
}

export function DispensingDetailPanel({
  selectedDispensing,
  batches,
  beneficiaries,
  dispensedBy,
  onClose,
}: DispensingDetailPanelProps) {
  if (selectedDispensing) {
    return <DetailView dispensing={selectedDispensing} onClose={onClose} />;
  }

  return (
    <CreateDispenseForm
      batches={batches}
      beneficiaries={beneficiaries}
      dispensedBy={dispensedBy}
    />
  );
}

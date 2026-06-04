"use client";

import { useState, useMemo, useActionState } from "react";
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
  UserSearch,
  QrCode,
  CheckCircle,
  Info,
  AlertCircle,
} from "lucide-react";
import { recordDispensing } from "../actions";
import type { AvailableBatch, BeneficiaryEntry } from "../queries";

interface RecordDispensingFormProps {
  batches: AvailableBatch[];
  beneficiaries: BeneficiaryEntry[];
  dispensedBy: number;
}

const PRICE_PER_ML = 2;

export function RecordDispensingForm({
  batches,
  beneficiaries,
  dispensedBy,
}: RecordDispensingFormProps) {
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [volume, setVolume] = useState("");
  const [remarks, setRemarks] = useState("");
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const batchId = Number(formData.get("batch_id"));
      const beneficiaryId = Number(formData.get("beneficiary_id"));
      const vol = Number(formData.get("volume"));

      const result = await recordDispensing({
        batch_id: batchId,
        beneficiary_id: beneficiaryId,
        dispensed_by: dispensedBy,
        volume: vol,
        price: PRICE_PER_ML,
        remarks: formData.get("remarks") as string,
      });

      if (result.success) {
        setSelectedBeneficiary("");
        setSelectedBatchId("");
        setVolume("");
        setRemarks("");
      }

      return result;
    },
    null
  );

  const selectedBatch = useMemo(
    () => batches.find((b) => b.batch_id.toString() === selectedBatchId),
    [batches, selectedBatchId]
  );

  const volumeNum = Number(volume) || 0;
  const totalCost = volumeNum * PRICE_PER_ML;
  const exceedsAvailable = selectedBatch
    ? volumeNum > selectedBatch.available_vol
    : false;

  const errors =
    state && !state.success
      ? (state.errors as Record<string, string[]>)
      : null;

  return (
    <div className="bg-popover border border-border rounded-sm p-5 sticky top-20 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        <div className="w-8 h-8 rounded-sm bg-primary text-primary-foreground flex items-center justify-center">
          <CheckCircle className="h-4 w-4" />
        </div>
        <h2 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
          Record Dispensing
        </h2>
      </div>

      <form action={formAction} className="space-y-5">
        {/* Beneficiary Select */}
        <div>
          <Label className="text-xs leading-4 font-medium tracking-wide text-muted-foreground uppercase mb-1.5 block">
            Recipient ID / Name
          </Label>
          <Select
            name="beneficiary_id"
            value={selectedBeneficiary}
            onValueChange={setSelectedBeneficiary}
          >
            <SelectTrigger className="h-10 bg-background border-border text-sm">
              <SelectValue placeholder="Search recipient..." />
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
          <input
            type="hidden"
            name="beneficiary_id"
            value={selectedBeneficiary}
          />
          {errors?.beneficiary_id && (
            <p className="text-xs text-destructive mt-1">
              {errors.beneficiary_id[0]}
            </p>
          )}
        </div>

        {/* Batch Select */}
        <div>
          <Label className="text-xs leading-4 font-medium tracking-wide text-muted-foreground mb-1.5 block">
            Batch ID
          </Label>
          <div className="flex gap-2">
            <Select
              name="batch_id"
              value={selectedBatchId}
              onValueChange={setSelectedBatchId}
            >
              <SelectTrigger className="h-10 bg-background border-border text-sm font-mono flex-1">
                <SelectValue placeholder="Select batch..." />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem
                    key={b.batch_id}
                    value={b.batch_id.toString()}
                  >
                    {b.batch_code} — {b.available_vol.toLocaleString()} mL
                    available
                  </SelectItem>
                ))}
                {batches.length === 0 && (
                  <SelectItem value="none" disabled>
                    No available batches
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <input type="hidden" name="batch_id" value={selectedBatchId} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 border-border bg-card shrink-0"
            >
              <QrCode className="h-5 w-5 text-foreground" />
            </Button>
          </div>
          {selectedBatch && (
            <div className="mt-2 p-2 bg-muted border border-border rounded-sm text-xs text-muted-foreground flex items-center gap-2">
              <Info className="text-primary size-4 shrink-0" />
              Batch {selectedBatch.batch_code} selected —{" "}
              {selectedBatch.available_vol.toLocaleString()} mL available
            </div>
          )}
          {errors?.batch_id && (
            <p className="text-xs text-destructive mt-1">
              {errors.batch_id[0]}
            </p>
          )}
        </div>

        {/* Volume + Administered By */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs leading-4 font-medium tracking-wide text-muted-foreground mb-1.5 block">
              Volume (mL)
            </Label>
            <Input
              name="volume"
              type="number"
              min={0}
              step={10}
              placeholder="0"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className={cn(
                "h-10 bg-background border-border text-sm",
                exceedsAvailable && "border-destructive focus:ring-destructive"
              )}
            />
            {exceedsAvailable && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="size-3" />
                Exceeds available stock
              </p>
            )}
            {errors?.volume && (
              <p className="text-xs text-destructive mt-1">
                {errors.volume[0]}
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs leading-4 font-medium tracking-wide text-muted-foreground mb-1.5 block">
              Administered By
            </Label>
            <Input
              disabled
              value={`Staff #${dispensedBy}`}
              className="h-10 bg-muted border-border text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>

        {/* Clinical Notes */}
        <div>
          <Label className="text-xs leading-4 font-medium tracking-wide text-muted-foreground mb-1.5 block">
            Clinical Notes (Optional)
          </Label>
          <textarea
            name="remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Add notes..."
            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
          />
        </div>

        {/* Calculation Summary — ₱2/mL */}
        {volumeNum > 0 && (
          <div className="p-3 bg-muted border border-border rounded-sm space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rate</span>
              <span>
                ₱{PRICE_PER_ML}/mL
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Volume</span>
              <span>{volumeNum.toLocaleString()} mL</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-foreground pt-1 border-t border-border">
              <span>Total</span>
              <span>₱{totalCost.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Form-level error */}
        {errors?._form && (
          <p className="text-sm text-destructive">{errors._form[0]}</p>
        )}

        {/* Submit */}
        <div className="pt-4 border-t border-border">
          <Button
            type="submit"
            disabled={
              isPending ||
              !selectedBeneficiary ||
              !selectedBatchId ||
              !volumeNum ||
              exceedsAvailable
            }
            className="w-full h-11 gap-2 text-xs font-semibold uppercase tracking-wider"
          >
            <CheckCircle className="h-4 w-4" />
            {isPending ? "Processing..." : "Confirm Allocation"}
          </Button>
        </div>
      </form>
    </div>
  );
}

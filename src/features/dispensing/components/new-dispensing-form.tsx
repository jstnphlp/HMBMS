"use client";

import { useState, useMemo, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { Card, CardContent } from "@/core/ui/card";
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
  AlertCircle,
  ArrowLeft,
  Truck,
} from "lucide-react";
import { recordDispensing } from "../actions";
import type { AvailableBatch, BeneficiaryEntry } from "../queries";

interface NewDispensingFormProps {
  batches: AvailableBatch[];
  beneficiaries: BeneficiaryEntry[];
  dispensedBy: number;
}

const PRICE_PER_ML = 2;

export function NewDispensingForm({
  batches,
  beneficiaries,
  dispensedBy,
}: NewDispensingFormProps) {
  const router = useRouter();
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
        router.push("/dashboard/dispensing");
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
    <Card className="border-border shadow-none">
      <CardContent className="p-6">
        {/* Back link */}
        <button
          onClick={() => router.push("/dashboard/dispensing")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="size-3" />
          Back to Distribution
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-sm bg-primary text-primary-foreground flex items-center justify-center">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
              Record New Dispensing
            </h2>
            <p className="text-xs text-muted-foreground">
              Fill in the details below to log a milk distribution.
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-6">
          {/* Beneficiary */}
          <div>
            <Label className="text-xs leading-4 font-medium tracking-wide text-muted-foreground uppercase mb-1.5 block">
              Recipient
            </Label>
            <Select
              value={selectedBeneficiary}
              onValueChange={setSelectedBeneficiary}
            >
              <SelectTrigger className="h-11 bg-background border-border">
                <SelectValue placeholder="Select a beneficiary..." />
              </SelectTrigger>
              <SelectContent>
                {beneficiaries.map((b) => (
                  <SelectItem
                    key={b.beneficiary_id}
                    value={b.beneficiary_id.toString()}
                  >
                    REC-{String(b.beneficiary_id).padStart(4, "0")} —{" "}
                    {b.contact_no}
                    {b.remarks ? ` (${b.remarks})` : ""}
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

          {/* Batch */}
          <div>
            <Label className="text-xs leading-4 font-medium tracking-wide text-muted-foreground mb-1.5 block">
              Batch
            </Label>
            <Select
              value={selectedBatchId}
              onValueChange={setSelectedBatchId}
            >
              <SelectTrigger className="h-11 bg-background border-border font-mono">
                <SelectValue placeholder="Select an available batch..." />
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
            {selectedBatch && (
              <div className="mt-2 p-2 bg-muted border border-border rounded-sm text-xs text-muted-foreground flex items-center gap-2">
                <Info className="text-primary size-4 shrink-0" />
                Batch {selectedBatch.batch_code} —{" "}
                {selectedBatch.available_vol.toLocaleString()} mL in stock
              </div>
            )}
            {errors?.batch_id && (
              <p className="text-xs text-destructive mt-1">
                {errors.batch_id[0]}
              </p>
            )}
          </div>

          {/* Volume */}
          <div>
            <Label className="text-xs leading-4 font-medium tracking-wide text-muted-foreground mb-1.5 block">
              Volume (mL)
            </Label>
            <Input
              name="volume"
              type="number"
              min={0}
              step={10}
              placeholder="Enter volume in mL"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className={cn(
                "h-11 bg-background border-border",
                exceedsAvailable &&
                  "border-destructive focus:ring-destructive"
              )}
            />
            {exceedsAvailable && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="size-3" />
                Volume exceeds available stock (
                {selectedBatch?.available_vol.toLocaleString()} mL)
              </p>
            )}
            {errors?.volume && (
              <p className="text-xs text-destructive mt-1">
                {errors.volume[0]}
              </p>
            )}
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
              rows={3}
              placeholder="Add clinical notes or remarks..."
              className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          {/* Calculation Summary */}
          <div className="p-4 bg-muted border border-border rounded-sm space-y-2">
            <h3 className="text-xs leading-4 font-semibold tracking-wider uppercase text-foreground">
              Fee Calculation
            </h3>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Processing Rate</span>
              <span>₱{PRICE_PER_ML}.00 / mL</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Volume</span>
              <span>{volumeNum > 0 ? `${volumeNum.toLocaleString()} mL` : "—"}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
              <span>Total</span>
              <span>
                {volumeNum > 0 ? `₱${totalCost.toLocaleString()}.00` : "₱0.00"}
              </span>
            </div>
          </div>

          {/* Form error */}
          {errors?._form && (
            <p className="text-sm text-destructive">{errors._form[0]}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={
              isPending ||
              !selectedBeneficiary ||
              !selectedBatchId ||
              !volumeNum ||
              exceedsAvailable
            }
            className="w-full h-12 gap-2 text-sm font-bold uppercase tracking-wider"
          >
            <CheckCircle className="h-4 w-4" />
            {isPending ? "Processing..." : "Confirm Dispensing"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

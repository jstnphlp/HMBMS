"use client";

import { useTransition, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/core/ui/dialog";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { Textarea } from "@/core/ui/textarea";
import { Button } from "@/core/ui/button";
import { Separator } from "@/core/ui/separator";
import { recordRecipientDispensing } from "@/features/dispensing/actions";
import { Loader2, Droplets } from "lucide-react";

interface RecordDispensingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficiaryId: number;
  recipientName: string;
}

export function RecordDispensingModal({
  open,
  onOpenChange,
  beneficiaryId,
  recipientName,
}: RecordDispensingModalProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(formRef.current!);

    const rawInput = {
      beneficiary_id: beneficiaryId,
      dispensing_date: formData.get("dispensing_date")
        ? new Date(formData.get("dispensing_date") as string)
        : new Date(),
      volume: Number(formData.get("volume")),
      batch_reference: (formData.get("batch_reference") as string) || undefined,
      remarks: (formData.get("remarks") as string) || undefined,
    };

    startTransition(async () => {
      const result = await recordRecipientDispensing(rawInput);

      if (result.success) {
        toast.success(
          `${rawInput.volume} mL dispensed to ${recipientName} successfully.`
        );
        formRef.current?.reset();
        onOpenChange(false);
      } else {
        const errors = result.errors as Record<string, string[]>;
        const firstError = Object.values(errors).flat()[0];
        toast.error(firstError ?? "Failed to record dispensing.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg flex items-center gap-2">
            <Droplets className="size-5 text-primary" />
            Record Dispensing
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Log milk dispensed to{" "}
            <span className="font-medium text-foreground">{recipientName}</span>
            .
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <SectionHeader title="Dispensing Details" />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dispensing_date" className="text-foreground">
                Date of Dispensing
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="dispensing_date"
                name="dispensing_date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
                className="bg-card border-border text-foreground"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="volume" className="text-foreground">
                Volume (mL)
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="volume"
                name="volume"
                type="number"
                min={1}
                max={1200}
                step={10}
                placeholder="e.g. 120"
                required
                className="bg-card border-border text-foreground"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="batch_reference" className="text-foreground">
                Batch / Bottle Reference
                <span className="text-muted-foreground font-normal ml-1">
                  (Optional)
                </span>
              </Label>
              <Input
                id="batch_reference"
                name="batch_reference"
                placeholder="e.g. BATCH-2024-001"
                className="bg-card border-border text-foreground"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank to auto-assign from available stock.
              </p>
            </div>
          </div>

          <Separator className="bg-border" />

          <SectionHeader title="Additional Notes" />
          <div className="grid gap-2">
            <Label htmlFor="disp-remarks" className="text-foreground">
              Remarks
              <span className="text-muted-foreground font-normal ml-1">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="disp-remarks"
              name="remarks"
              placeholder="Enter any relevant notes..."
              rows={3}
              className="bg-card border-border text-foreground"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-border text-foreground"
              onClick={() => {
                formRef.current?.reset();
                onOpenChange(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirm Dispensing
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
        {title}
      </h3>
      <Separator className="flex-1 bg-border" />
    </div>
  );
}

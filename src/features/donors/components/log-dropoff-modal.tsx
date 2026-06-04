"use client";

import { useState, useTransition, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import { Separator } from "@/core/ui/separator";
import { cn } from "@/core/utils/cn";
import { recordDropoff } from "../actions";
import { Loader2 } from "lucide-react";

interface LogDropoffModalProps {
  donorId: number;
  donorName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogDropoffModal({
  donorId,
  donorName,
  open,
  onOpenChange,
}: LogDropoffModalProps) {
  const [isPending, startTransition] = useTransition();
  const [isPasteurized, setIsPasteurized] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(formRef.current!);

    startTransition(async () => {
      const result = await recordDropoff(donorId, formData);

      if (result.success) {
        toast.success("Drop-off recorded successfully.");
        formRef.current?.reset();
        setIsPasteurized(false);
        onOpenChange(false);
      } else {
        const errors = result.errors as Record<string, string[]>;
        const firstError = Object.values(errors).flat()[0];
        toast.error(firstError ?? "Failed to record drop-off.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">
            Log Drop-Off
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Record a new milk collection for{" "}
            <span className="font-medium text-foreground">{donorName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="is_pasteurized" value={isPasteurized ? "true" : "false"} />

          {/* Pasteurization Toggle */}
          <div className="grid gap-2">
            <Label className="text-foreground text-[12px] font-medium uppercase tracking-wider">
              Milk Status
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setIsPasteurized(false)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  !isPasteurized
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                Unpasteurized
              </button>
              <button
                type="button"
                onClick={() => setIsPasteurized(true)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  isPasteurized
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                Pasteurized
              </button>
            </div>
          </div>

          {/* Shared Fields */}
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
              Collection Details
            </h3>
            <Separator className="flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="collection_date" className="text-foreground">
                Date and Time
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="collection_date"
                name="collection_date"
                type="datetime-local"
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
                min="1"
                max="1200"
                step="1"
                placeholder="e.g. 150"
                required
                className="bg-card border-border text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="program" className="text-foreground">
                Mode of Collection
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Select name="program" required>
                <SelectTrigger
                  id="program"
                  className="bg-card border-border text-foreground w-full"
                >
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPSUP_TODO">Supsup Todo</SelectItem>
                  <SelectItem value="MILKY_WAY">Milky Way</SelectItem>
                  <SelectItem value="MOMS_ACT">Mom&apos;s Act</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expiration_date" className="text-foreground">
                Expiration Date
              </Label>
              <Input
                id="expiration_date"
                name="expiration_date"
                type="date"
                className="bg-card border-border text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="remarks" className="text-foreground">
              Condition / Notes
            </Label>
            <Textarea
              id="remarks"
              name="remarks"
              placeholder="e.g. Frozen, Fresh, room temperature storage..."
              className="bg-card border-border text-foreground min-h-16"
            />
          </div>

          {/* Pasteurized Section */}
          {isPasteurized && (
            <>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
                  Pasteurized Details
                </h3>
                <Separator className="flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="grid gap-2">
                  <Label htmlFor="batch_no" className="text-foreground">
                    Batch No.
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="batch_no"
                    name="batch_no"
                    placeholder="e.g. BATCH-2024-001"
                    className="bg-card border-border text-foreground"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bottle_no" className="text-foreground">
                    Bottle No.
                  </Label>
                  <Input
                    id="bottle_no"
                    name="bottle_no"
                    placeholder="Auto-generated if empty"
                    className="bg-card border-border text-foreground"
                  />
                </div>
              </div>
            </>
          )}

          {/* Unpasteurized Section */}
          {!isPasteurized && (
            <>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
                  Unpasteurized Details
                </h3>
                <Separator className="flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="grid gap-2">
                  <Label htmlFor="dtn" className="text-foreground">
                    DTN (Donation Tracking No.)
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="dtn"
                    name="dtn"
                    placeholder="e.g. DTN-2024-001"
                    className="bg-card border-border text-foreground"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="aob" className="text-foreground">
                    AOB (Age of Baby)
                  </Label>
                  <Input
                    id="aob"
                    name="aob"
                    placeholder="e.g. 3 months"
                    className="bg-card border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="collected_by" className="text-foreground">
                  Collected By
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Input
                  id="collected_by"
                  name="collected_by"
                  placeholder="Name of person who collected the milk"
                  className="bg-card border-border text-foreground"
                />
              </div>

              <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                <p className="text-[12px] text-primary font-medium">
                  This collection will be routed to the laboratory for pre-pasteurization testing.
                </p>
              </div>
            </>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-border text-foreground"
              onClick={() => onOpenChange(false)}
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
              Record Drop-Off
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

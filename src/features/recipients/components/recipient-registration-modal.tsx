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
import { createRecipient } from "../actions";
import { Loader2 } from "lucide-react";

interface RecipientRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipientRegistrationModal({
  open,
  onOpenChange,
}: RecipientRegistrationModalProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(formRef.current!);

    const rawInput = {
      name: formData.get("name") as string,
      contact_no: formData.get("contact_no") as string,
      remarks: formData.get("remarks") as string,
    };

    startTransition(async () => {
      const result = await createRecipient(rawInput);

      if (result.success) {
        toast.success("Recipient registered successfully.");
        formRef.current?.reset();
        onOpenChange(false);
      } else {
        const errors = result.errors as Record<string, string[]>;
        const firstError = Object.values(errors).flat()[0];
        toast.error(firstError ?? "Failed to register recipient.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">
            Register New Recipient
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new infant or hospital beneficiary to the milk bank registry.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Information */}
          <SectionHeader title="Recipient Information" />
          <div className="grid gap-4">
            <Field
              label="Recipient Name"
              name="name"
              placeholder="e.g. Baby Sofia, Makati General Hospital NICU"
              required
            />
            <Field
              label="Contact Number"
              name="contact_no"
              placeholder="09XXXXXXXXX"
              required
            />
          </div>

          <Separator className="bg-border" />

          {/* Additional Details */}
          <SectionHeader title="Additional Details" />
          <div className="grid gap-2">
            <Label htmlFor="remarks" className="text-foreground">
              Remarks
              <span className="text-muted-foreground font-normal ml-1">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="remarks"
              name="remarks"
              placeholder="Enter any relevant notes (e.g., hospital ward, medical condition, special instructions)..."
              rows={3}
              className="bg-card border-border text-foreground"
            />
          </div>

          {/* Submit */}
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
              Register Recipient
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

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name} className="text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="bg-card border-border text-foreground"
      />
    </div>
  );
}

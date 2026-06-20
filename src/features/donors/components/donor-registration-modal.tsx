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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import { Separator } from "@/core/ui/separator";
import { registerDonor } from "../actions";
import { Loader2 } from "lucide-react";

interface DonorRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DonorRegistrationModal({
  open,
  onOpenChange,
}: DonorRegistrationModalProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(formRef.current!);

    startTransition(async () => {
      const result = await registerDonor(formData);

      if (result.success) {
        toast.success("Donor registered successfully.");
        formRef.current?.reset();
        onOpenChange(false);
      } else {
        const errors = result.errors as Record<string, string[]>;
        const firstError = Object.values(errors).flat()[0];
        toast.error(firstError ?? "Failed to register donor.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-hidden bg-background border-border flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">
            Donor Registration Form
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Fill in the donor&apos;s information to register them into the
            system.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="max-h-[calc(90vh-9rem)] overflow-y-auto pr-1 space-y-6">
            {/* Personal Information */}
            <SectionHeader title="Personal Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Field
              label="First Name"
              name="first_name"
              placeholder="First name"
              required
            />
            <Field label="Middle Name" name="middle_name" placeholder="Middle name" />
            <Field
              label="Last Name"
              name="last_name"
              placeholder="Last name"
              required
            />
          </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Field
              label="Date of Birth"
              name="birthdate"
              type="date"
              required
            />
            <Field
              label="Contact Number"
              name="contact_no"
              placeholder="09XXXXXXXXX"
              required
            />
            <SelectField
              label="Civil Status"
              name="civil_status"
              required
              options={[
                { value: "Single", label: "Single" },
                { value: "Married", label: "Married" },
                { value: "Widowed", label: "Widowed" },
                { value: "Separated", label: "Separated" },
                { value: "Divorced", label: "Divorced" },
              ]}
            />
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Field
              label="Address"
              name="address"
              placeholder="Complete address"
              required
            />
            <div className="grid grid-cols-2 gap-4 items-end">
              <Field label="Religion" name="religion" placeholder="Religion" />
              <Field
                label="Occupation"
                name="occupation"
                placeholder="Occupation"
              />
            </div>
          </div>

            <Separator className="bg-border" />

            {/* Spouse Information */}
            <SectionHeader title="Spouse Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Field
              label="Name of Spouse"
              name="spouse_name"
              placeholder="Spouse full name"
            />
            <Field
              label="Spouse Occupation"
              name="spouse_occupation"
              placeholder="Occupation"
            />
            <Field
              label="Spouse Contact No."
              name="spouse_contact_no"
              placeholder="09XXXXXXXXX"
            />
          </div>

            <Separator className="bg-border" />

            {/* Delivery Information */}
            <SectionHeader title="Pregnancy / Delivery Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Field label="Date of Delivery" name="delivery_date" type="date" />
            <Field
              label="Place of Delivery"
              name="delivery_place"
              placeholder="Hospital / facility"
            />
            <SelectField
              label="Type of Delivery"
              name="delivery_type"
              options={[
                { value: "Normal", label: "Normal" },
                { value: "Cesarean", label: "Cesarean" },
                { value: "Assisted", label: "Assisted" },
              ]}
            />
          </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Field
              label="AOG (Age of Gestation)"
              name="aog"
              placeholder="e.g. 37 weeks"
            />
          </div>
            <div className="grid grid-cols-1">
              <TextAreaField
                label="Additional Pregnancy / Delivery Details"
                name="pregnancy_delivery_details"
                placeholder="Additional pregnancy or delivery notes"
              />
          </div>

            <Separator className="bg-border" />

            {/* Infant Information */}
            <SectionHeader title="Infant Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <Field
              label="Infant's Name"
              name="infant_name"
              placeholder="Baby's name"
            />
            <Field
              label="Infant's Date of Birth"
              name="infant_birthdate"
              type="date"
            />
            <SelectField
              label="Sex"
              name="infant_sex"
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ]}
            />
            <Field
              label="Birth Weight"
              name="infant_birth_weight"
              placeholder="e.g. 3.2 kg"
            />
          </div>
            <div className="grid grid-cols-1">
              <TextAreaField
                label="Additional Infant Details"
                name="infant_details"
                placeholder="Additional infant notes"
              />
          </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-border bg-background pt-4 mt-4">
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
              Register Donor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name} className="text-foreground">
        {label}
      </Label>
      <Textarea
        id={name}
        name={name}
        placeholder={placeholder}
        className="min-h-20 bg-card border-border text-foreground"
      />
    </div>
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

function SelectField({
  label,
  name,
  options,
  required = false,
  placeholder = "Select",
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name} className="text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Select name={name}>
        <SelectTrigger
          id={name}
          className="bg-card border-border text-foreground w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

"use client";

import { useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/core/ui/dialog";
import { Label } from "@/core/ui/label";
import { Textarea } from "@/core/ui/textarea";
import { Button } from "@/core/ui/button";
import { Separator } from "@/core/ui/separator";
import { sendSms } from "../actions";
import { Loader2, MessageSquare, Phone } from "lucide-react";

interface SendSmsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficiaryId: number;
  recipientName: string;
  contactNo: string;
  totalVolume: number;
}

function buildSmsTemplate(name: string, volume: number): string {
  return `Hello ${name}, your prescribed human milk (${volume} mL) is now ready for dispensing at the Main Clinic. Please present your ID upon claiming.`;
}

export function SendSmsModal({
  open,
  onOpenChange,
  beneficiaryId,
  recipientName,
  contactNo,
  totalVolume,
}: SendSmsModalProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && messageRef.current) {
      messageRef.current.value = buildSmsTemplate(
        recipientName,
        totalVolume
      );
    }
  }, [open, recipientName, totalVolume]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    const message = formData.get("message") as string;

    startTransition(async () => {
      const result = await sendSms({
        beneficiary_id: beneficiaryId,
        phone_number: contactNo,
        message,
      });

      if (result.success) {
        toast.success("SMS sent successfully.");
        onOpenChange(false);
      } else {
        const errors = result.errors as Record<string, string[]>;
        const firstError = Object.values(errors).flat()[0];
        toast.error(firstError ?? "Failed to send SMS.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            Send SMS
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Send a notification to{" "}
            <span className="font-medium text-foreground">
              {recipientName}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <SectionHeader title="Recipient Details" />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="text-foreground">Contact Number</Label>
              <div className="flex items-center gap-2 h-10 px-3 bg-muted border border-border rounded-md">
                <Phone className="size-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground font-medium">
                  {contactNo}
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          <SectionHeader title="Message" />
          <div className="grid gap-2">
            <Label htmlFor="sms-message" className="text-foreground">
              Message Body
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Textarea
              id="sms-message"
              name="message"
              ref={messageRef}
              rows={4}
              maxLength={160}
              required
              className="bg-card border-border text-foreground"
            />
            <p className="text-[11px] text-muted-foreground">
              Max 160 characters. The message has been pre-filled with a
              template.
            </p>
          </div>

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
              Send SMS
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/ui/form";
import { Input } from "@/core/ui/input";
import { Textarea } from "@/core/ui/textarea";
import { Button } from "@/core/ui/button";
import { Separator } from "@/core/ui/separator";
import {
  createRecipientSchema,
  type CreateRecipientInput,
} from "../schemas";
import { createRecipient } from "../actions";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";

export function NewRecipientForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateRecipientInput>({
    resolver: zodResolver(createRecipientSchema),
    defaultValues: {
      contact_no: "",
      remarks: "",
    },
  });

  async function onSubmit(data: CreateRecipientInput) {
    setIsSubmitting(true);
    setServerError(null);

    const result = await createRecipient(data);

    if (result.success) {
      router.push("/dashboard/recipients");
      router.refresh();
    } else {
      const firstError = Object.values(result.errors).flat()[0];
      setServerError(firstError ?? "An error occurred while creating the recipient.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/recipients">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
            Register New Recipient
          </h1>
          <p className="text-xs text-muted-foreground">
            Add a new infant or hospital beneficiary to the milk bank registry.
          </p>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Form Card */}
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="bg-card border-b border-border">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            Recipient Information
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Enter the contact details for the new recipient. Additional clinical
            information can be added after registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Number */}
              <FormField
                control={form.control}
                name="contact_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">
                      Contact Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="09171234567"
                        className="h-9 text-sm bg-surface border-border focus:ring-1 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Remarks */}
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">
                      Remarks
                      <span className="text-muted-foreground font-normal ml-1">
                        (Optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter any relevant notes about this recipient (e.g., infant name, hospital ward, medical condition)..."
                        rows={4}
                        className="text-sm bg-surface border-border focus:ring-1 focus:ring-primary resize-none"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Server Error */}
              {serverError && (
                <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {serverError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Link href="/dashboard/recipients" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-xs border-border"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-3.5 mr-1.5" />
                      Register Recipient
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/ui/dialog";
import { Plus, Loader2, Eye, EyeOff } from "lucide-react";
import { createStaffMember } from "../actions";
import { toast } from "sonner";

export function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setFullName("");
    setEmail("");
    setRole("STAFF");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
  }

  function handleSubmit() {
    const fieldErrors: Record<string, string[]> = {};

    if (!fullName.trim()) fieldErrors.full_name = ["Full name is required"];
    if (!email.trim()) fieldErrors.email = ["Email is required"];
    if (password.length < 8)
      fieldErrors.password = ["Password must be at least 8 characters"];
    if (password !== confirmPassword)
      fieldErrors.confirmPassword = ["Passwords do not match"];

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    startTransition(async () => {
      const result = await createStaffMember({
        email,
        full_name: fullName,
        role,
        password,
      });

      if (result.success) {
        toast.success("Staff member added successfully.");
        resetForm();
        setOpen(false);
      } else {
        setErrors(result.errors as Record<string, string[]>);
        const firstError = Object.values(
          result.errors as Record<string, string[]>
        ).flat()[0];
        toast.error(firstError ?? "Failed to add staff member.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 text-xs font-medium">
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Full Name
            </Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              className="mt-1.5"
            />
            {errors.full_name && (
              <p className="text-xs text-destructive mt-1">
                {errors.full_name[0]}
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. staff@makatimilkbank.gov"
              className="mt-1.5"
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">
                {errors.email[0]}
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Role
            </Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "ADMIN" | "STAFF")}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Password
            </Label>
            <div className="relative mt-1.5">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive mt-1">
                {errors.password[0]}
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Confirm Password
            </Label>
            <div className="relative mt-1.5">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">
                {errors.confirmPassword[0]}
              </p>
            )}
          </div>

          {errors._form && (
            <p className="text-xs text-destructive">{errors._form[0]}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Creating..." : "Create Staff Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/core/ui/sheet";
import { Switch } from "@/core/ui/switch";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { updateStaffMember, deleteStaffMember, toggleStaffActive } from "../actions";
import { toast } from "sonner";

interface StaffMember {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}

interface EditStaffSheetProps {
  user: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStaffSheet({
  user,
  open,
  onOpenChange,
}: EditStaffSheetProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function resetForm() {
    setFullName("");
    setEmail("");
    setRole("STAFF");
    setIsActive(true);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
    setConfirmDelete(false);
  }

  function handleOpenChange(v: boolean) {
    if (!v) resetForm();
    onOpenChange(v);
  }

  function handleSave() {
    if (!user) return;

    const fieldErrors: Record<string, string[]> = {};
    if (!fullName.trim()) fieldErrors.full_name = ["Full name is required"];
    if (!email.trim()) fieldErrors.email = ["Email is required"];
    if (password && password.length < 8)
      fieldErrors.password = ["Password must be at least 8 characters"];
    if (password && password !== confirmPassword)
      fieldErrors.confirmPassword = ["Passwords do not match"];

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    startSave(async () => {
      const result = await updateStaffMember({
        user_id: user.user_id,
        email,
        full_name: fullName,
        role,
        password: password || undefined,
      });

      if (result.success) {
        toast.success("Staff member updated.");
        handleOpenChange(false);
      } else {
        setErrors(result.errors as Record<string, string[]>);
        const firstError = Object.values(
          result.errors as Record<string, string[]>
        ).flat()[0];
        toast.error(firstError ?? "Failed to update staff member.");
      }
    });
  }

  function handleDelete() {
    if (!user) return;

    startDelete(async () => {
      const result = await deleteStaffMember(user.user_id);
      if (result.success) {
        toast.success("Staff member removed.");
        handleOpenChange(false);
      } else {
        const firstError = Object.values(
          result.errors as Record<string, string[]>
        ).flat()[0];
        toast.error(firstError ?? "Failed to remove staff member.");
      }
    });
  }

  function handleToggleActive(value: boolean) {
    if (!user) return;
    setIsActive(value);
    toggleStaffActive(user.user_id, value);
    toast.success(value ? "Staff member activated." : "Staff member deactivated.");
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit Staff Member</SheetTitle>
          <SheetDescription>
            {user?.full_name || user?.email || "Staff member"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Full Name
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Status
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isActive ? "Account is active" : "Account is deactivated"}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={handleToggleActive}
              />
            </div>

            <div className="h-px bg-border" />

            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                New Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
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
                Confirm New Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
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
          </div>
        </div>

        <SheetFooter className="px-4 pb-4 flex flex-col gap-3">
          {confirmDelete ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 space-y-3">
              <p className="text-destructive text-sm font-medium">
                Are you sure you want to remove {user?.full_name || "this staff member"}?
                This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs text-destructive border-destructive"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  )}
                  Confirm Remove
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={isSaving}
                  onClick={handleSave}
                >
                  {isSaving && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  )}
                  Save Changes
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-destructive border-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                Remove Staff Member
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

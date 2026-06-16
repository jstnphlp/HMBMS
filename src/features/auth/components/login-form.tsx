"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { login } from "../actions";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import {
  Card,
  CardContent,
} from "@/core/ui/card";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom");
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);

    const result = await login(formData);

    if (result && !result.success) {
      if ("errors" in result && result.errors) {
        setErrors(result.errors as Record<string, string[]>);
      }
      if ("error" in result && result.error) {
        toast.error(result.error as string);
      }
      setPending(false);
    }
  }

  return (
    <Card className="w-full border-border shadow-sm">
      <CardContent className="p-10">
        {/* Title block */}
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            System Login
          </h2>
          <p className="text-sm text-muted-foreground">
            Please enter your institutional credentials to continue.
          </p>
        </div>

        <form action={handleSubmit} className="flex flex-col gap-6">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="email"
              className="text-xs leading-4 font-medium tracking-wide text-foreground uppercase"
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="staff@makatimilkbank.gov.ph"
                disabled={pending}
                className="h-11 bg-muted pl-10 placeholder:text-muted-foreground/40"
              />
            </div>
            {errors?.email && (
              <p className="text-sm text-destructive">{errors.email[0]}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              className="text-xs leading-4 font-medium tracking-wide text-foreground uppercase"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                disabled={pending}
                className="h-11 bg-muted pl-10 pr-10 placeholder:text-muted-foreground/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <button
              type="button"
              className="w-fit text-xs font-bold text-primary transition-colors hover:underline"
            >
              Forgot password?
            </button>
            {errors?.password && (
              <p className="text-sm text-destructive">
                {errors.password[0]}
              </p>
            )}
          </div>

          {/* Redirect notice */}
          {redirectedFrom && !errors && (
            <p className="text-sm text-muted-foreground">
              You must log in to access that page.
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={pending}
            className="h-12 w-full gap-2 text-sm font-bold tracking-widest uppercase"
          >
            <span>{pending ? "Signing In..." : "Sign In"}</span>
            {!pending && <LogIn className="h-4 w-4" />}
          </Button>
        </form>

        {/* Security notice */}
        
      </CardContent>
    </Card>
  );
}

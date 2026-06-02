"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "../actions";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/ui/card";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom");
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    setGeneralError(null);

    const result = await login(formData);

    if (result && !result.success) {
      if ("errors" in result && result.errors) {
        setErrors(result.errors as Record<string, string[]>);
      }
      if ("error" in result && result.error) {
        setGeneralError(result.error as string);
      }
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">HMBMS Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                disabled={pending}
              />
              {errors?.email && (
                <p className="text-sm text-destructive">
                  {errors.email[0]}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                disabled={pending}
              />
              {errors?.password && (
                <p className="text-sm text-destructive">
                  {errors.password[0]}
                </p>
              )}
            </div>

            {generalError && (
              <p className="text-sm text-destructive">{generalError}</p>
            )}

            {redirectedFrom && !generalError && !errors && (
              <p className="text-sm text-muted-foreground">
                You must log in to access that page.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

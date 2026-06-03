import { getCurrentUser } from "@/features/auth/actions";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">
            Welcome back, {user.email}
          </p>
          <p className="mt-2 text-sm">
            Role: <span className="font-medium">{user.role}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

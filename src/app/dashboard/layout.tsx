import { getCurrentUser } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}

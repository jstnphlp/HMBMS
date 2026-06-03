import { getCurrentUser } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/features/dashboard/components/sidebar-nav";
import { TopNav } from "@/features/dashboard/components/top-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <SidebarNav />
      <div className="flex flex-1 flex-col ml-64">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

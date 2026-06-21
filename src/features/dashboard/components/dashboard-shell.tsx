"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SidebarNav } from "@/features/dashboard/components/sidebar-nav";
import { TopNav } from "@/features/dashboard/components/top-nav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex h-dvh min-h-screen w-full overflow-hidden bg-background text-foreground">
      <SidebarNav variant="rail" className="hidden md:flex lg:hidden" />
      <SidebarNav variant="full" className="hidden lg:flex" />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative h-full w-[min(20rem,85vw)] bg-muted shadow-xl">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 rounded-sm p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setMobileNavOpen(false)}
            >
              <X className="size-5" />
            </button>
            <SidebarNav
              variant="full"
              className="h-full w-full"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onOpenNavigation={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 overflow-auto px-3 py-4 sm:px-4 md:px-5 lg:px-6 lg:py-6">
          <div className="min-w-0 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

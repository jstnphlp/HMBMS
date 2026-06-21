"use client";

import { Bell, Menu } from "lucide-react";

export function TopNav({
  onOpenNavigation,
}: {
  onOpenNavigation?: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation"
          className="rounded-sm p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          onClick={onOpenNavigation}
        >
          <Menu className="size-5" />
        </button>
        <span className="truncate text-base font-bold leading-8 text-primary sm:text-lg">
          Human Milk Bank
        </span>
      </div>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          aria-label="View notifications"
          className="rounded-sm p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

"use client";

import { Bell } from "lucide-react";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center">
        <span className="text-lg leading-8 font-bold text-primary">
          Human Milk Bank
        </span>
      </div>

      <div className="flex items-center">
        <button className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

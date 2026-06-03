"use client";

import { Input } from "@/core/ui/input";
import { Search, Bell, Settings, User } from "lucide-react";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center">
        <span className="text-lg leading-8 font-bold text-primary">
          LacTech Clinical
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 w-64 border-border bg-muted pl-8 text-sm"
          />
        </div>

        {/* Notifications */}
        <button className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted">
          <Bell className="h-5 w-5" />
        </button>

        {/* Settings */}
        <button className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted">
          <Settings className="h-5 w-5" />
        </button>

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-accent">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}

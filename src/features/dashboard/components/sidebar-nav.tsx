"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/core/utils/cn";
import { Button } from "@/core/ui/button";
import {
  Droplets,
  Users,
  Baby,
  FlaskConical,
  Truck,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  { label: "Inventory", href: "/dashboard/inventory", icon: Droplets },
  { label: "Donors", href: "/dashboard/donors", icon: Users },
  { label: "Recipients", href: "/dashboard/recipients", icon: Baby },
  { label: "Lab Tests", href: "/dashboard/laboratory", icon: FlaskConical },
  { label: "Distribution", href: "/dashboard/dispensing", icon: Truck },
  { label: "Reporting", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "System Settings", href: "/dashboard/settings", icon: Settings },
];

const bottomNav: NavItem[] = [
  { label: "Help", href: "/dashboard/help", icon: HelpCircle },
  { label: "Sign Out", href: "/login", icon: LogOut },
];

function SidebarLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  return (
    <li className="mb-1 px-3">
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-none px-3 py-2 transition-all active:opacity-80",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent"
        )}
      >
        <item.icon className="h-5 w-5" />
        <span className="text-xs leading-4 font-medium tracking-wide">
          {item.label}
        </span>
      </Link>
    </li>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-muted pb-4 pt-14">
      {/* Clinic header */}
      <div className="mb-6 mt-4 px-4">
        <h2 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
          Main Clinic
        </h2>
        <p className="text-xs leading-4 font-medium tracking-wide text-muted-foreground">
          Station 04-B
        </p>
      </div>

      {/* New Log button */}
      <div className="mb-4 px-4">
        <Button className="w-full gap-2 rounded-sm text-xs font-medium uppercase tracking-wider">
          <Plus className="h-4 w-4" />
          New Log
        </Button>
      </div>

      {/* Main nav */}
      <ul className="flex flex-grow flex-col">
        {mainNav.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </ul>

      {/* Bottom nav */}
      <ul className="mt-auto flex flex-col pb-4">
        {bottomNav.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </ul>
    </nav>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/core/utils/cn";
import {
  LayoutDashboard,
  Droplets,
  Users,
  Baby,
  Truck,
  FlaskConical,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "@/features/auth/actions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/dashboard/inventory", icon: Droplets },
  { label: "Donors", href: "/dashboard/donors", icon: Users },
  { label: "Collections", href: "/dashboard/laboratory", icon: FlaskConical },
  { label: "Recipients", href: "/dashboard/recipients", icon: Baby },
  { label: "Distribution", href: "/dashboard/distribution", icon: Truck },
  { label: "Reporting", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "System Settings", href: "/dashboard/settings", icon: Settings },
];

const bottomNav: NavItem[] = [
  { label: "Sign Out", href: "#sign-out", icon: LogOut },
];

function SidebarLink({
  item,
  active,
  onClick,
  variant,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
  variant: "full" | "rail";
}) {
  const router = useRouter();
  const prefetchRoute = () => router.prefetch(item.href);
  const isRail = variant === "rail";

  return (
    <li className={cn("mb-1", isRail ? "px-2" : "px-3")}>
      <Link
        href={item.href}
        prefetch={true}
        onMouseEnter={prefetchRoute}
        onFocus={prefetchRoute}
        onClick={onClick}
        aria-label={isRail ? item.label : undefined}
        title={isRail ? item.label : undefined}
        className={cn(
          "flex cursor-pointer items-center rounded-none py-2 transition-all active:opacity-80",
          isRail ? "justify-center px-0" : "gap-3 px-3",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span
          className={cn(
            "text-xs leading-4 font-medium tracking-wide",
            isRail && "sr-only"
          )}
        >
          {item.label}
        </span>
      </Link>
    </li>
  );
}

export function SidebarNav({
  variant = "full",
  className,
  onNavigate,
}: {
  variant?: "full" | "rail";
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const activePath = pendingHref ?? pathname;
  const isRail = variant === "rail";

  return (
    <nav
      className={cn(
        "flex h-dvh shrink-0 flex-col border-r border-border bg-muted pb-4",
        isRail ? "w-20 pt-4" : "w-[280px] pt-14",
        className
      )}
    >
      {/* Clinic header */}
      <div className={cn("mb-6", isRail ? "mt-2 px-2" : "mt-4 px-4")}>
        {isRail ? (
          <div className="mx-auto flex size-10 items-center justify-center rounded-sm bg-primary text-sm font-bold text-primary-foreground">
            MB
            <span className="sr-only">Makati Branch, Ospital ng Makati</span>
          </div>
        ) : (
          <>
            <h2 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
              Makati Branch
            </h2>
            <p className="text-xs leading-4 font-medium tracking-wide text-muted-foreground">
              Ospital ng Makati
            </p>
          </>
        )}
      </div>

      {/* Main nav */}
      <ul className="flex flex-grow flex-col">
        {mainNav.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            variant={variant}
            active={
              item.href === "/dashboard"
                ? activePath === "/dashboard"
                : activePath === item.href || activePath.startsWith(item.href + "/")
            }
            onClick={() => {
              if (item.href !== pathname) {
                setPendingHref(item.href);
              }
              onNavigate?.();
            }}
          />
        ))}
      </ul>

      {/* Bottom nav */}
      <ul className="mt-auto flex flex-col pb-4">
        {bottomNav.map((item) =>
          item.href === "#sign-out" ? (
            <li key={item.label} className={cn("mb-1", isRail ? "px-2" : "px-3")}>
              <button
                onClick={() => logout()}
                aria-label={isRail ? item.label : undefined}
                title={isRail ? item.label : undefined}
                className={cn(
                  "flex w-full cursor-pointer items-center rounded-none py-2 transition-all active:opacity-80 text-muted-foreground hover:bg-accent",
                  isRail ? "justify-center px-0" : "gap-3 px-3"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span
                  className={cn(
                    "text-xs leading-4 font-medium tracking-wide",
                    isRail && "sr-only"
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          ) : (
            <SidebarLink
              key={item.href}
              item={item}
              variant={variant}
              active={
                activePath === item.href || activePath.startsWith(item.href + "/")
              }
            />
          )
        )}
      </ul>
    </nav>
  );
}

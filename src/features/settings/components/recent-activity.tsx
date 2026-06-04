import { cn } from "@/core/utils/cn";
import { Bell } from "lucide-react";

interface ActivityItem {
  id: string;
  description: string;
  highlight?: string;
  source: string;
  timestamp: string;
  color: "primary" | "tertiary" | "muted";
}

const dotColorMap: Record<ActivityItem["color"], string> = {
  primary: "bg-primary",
  tertiary: "bg-secondary-foreground",
  muted: "bg-border",
};

interface RecentActivityProps {
  items?: ActivityItem[];
}

const defaultItems: ActivityItem[] = [
  {
    id: "1",
    description: "Config updated:",
    highlight: "Pasteurization Temp Limits",
    source: "System Admin",
    timestamp: "10 mins ago",
    color: "primary",
  },
  {
    id: "2",
    description: "New user added:",
    highlight: "Dr. Alan Grant",
    source: "HR Dept",
    timestamp: "2 hours ago",
    color: "tertiary",
  },
  {
    id: "3",
    description: "Routine DB Backup Completed",
    source: "System Auto",
    timestamp: "03:00 AM",
    color: "muted",
  },
];

export function RecentActivity({ items = defaultItems }: RecentActivityProps) {
  return (
    <div className="flex flex-1 flex-col border border-border bg-background p-4 rounded-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Bell className="h-5 w-5 text-muted-foreground" />
        Recent Activity
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div
              className={cn(
                "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
                dotColorMap[item.color]
              )}
            />
            <div>
              <p className="text-[13px] leading-tight text-foreground">
                {item.description}{" "}
                {item.highlight && (
                  <span className="font-medium">{item.highlight}</span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {item.source} • {item.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

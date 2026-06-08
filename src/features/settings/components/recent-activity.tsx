import { Bell } from "lucide-react";

interface ActivityItem {
  id: string;
  description: string;
  source: string;
  timestamp: string;
}

interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div className="flex flex-1 flex-col border border-border bg-background p-4 rounded-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Bell className="h-5 w-5 text-muted-foreground" />
        Recent Activity
      </h3>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No recent activity.
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
            <div>
              <p className="text-[13px] leading-tight text-foreground">
                {item.description}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {item.source} · {item.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

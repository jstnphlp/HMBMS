import { Users } from "lucide-react";

interface SettingsStatsProps {
  activeCount: number;
}

export function SettingsStats({ activeCount }: SettingsStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
      <div className="flex flex-col justify-between border border-border bg-background p-4 rounded-sm">
        <div className="mb-2 flex items-start justify-between">
          <span className="text-xs leading-4 font-medium tracking-wider text-muted-foreground uppercase">
            Active Staff
          </span>
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-foreground">
            {activeCount}
          </span>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { cn } from "@/core/utils/cn";
import type { RecentMilkInventoryRow } from "../queries";

const PROGRAM_LABELS: Record<string, string> = {
  SUPSUP_TODO: "Supsup Todo",
  MILKY_WAY: "Milky Way",
  MOMS_ACT: "Mom's Act",
};

const STATUS_CONFIG: Record<string, { className: string }> = {
  "Ready for Lab": { className: "bg-amber-100 text-amber-900" },
  "Awaiting Result": { className: "bg-amber-100 text-amber-900" },
  Testing: { className: "bg-primary/10 text-primary" },
  Passed: { className: "bg-green-100 text-green-900" },
  Failed: { className: "bg-destructive/10 text-destructive" },
  Pooling: { className: "bg-muted text-muted-foreground" },
  Pasteurized: { className: "bg-blue-100 text-blue-900" },
  Available: { className: "bg-primary/10 text-primary" },
  Dispensed: { className: "bg-muted text-muted-foreground" },
  Disposed: { className: "bg-destructive/10 text-destructive" },
  "To Dispose": { className: "bg-destructive/10 text-destructive" },
};

function formatDate(iso: string | null) {
  if (!iso) return "--";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

interface InventoryTableProps {
  batches: RecentMilkInventoryRow[];
}

export function InventoryTable({ batches }: InventoryTableProps) {
  return (
    <div className="rounded-none border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted p-4">
        <h3 className="text-xs leading-4 font-semibold tracking-wider text-foreground uppercase">
          Recent Milk Inventory
        </h3>
        <Link
          href="/dashboard/inventory"
          className="text-xs font-medium text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-card text-xs leading-4 font-medium tracking-wider text-muted-foreground uppercase">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Collection Date</th>
              <th className="px-4 py-2">Donor Name</th>
              <th className="px-4 py-2">Program</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Volume (mL)</th>
            </tr>
          </thead>
          <tbody className="text-sm text-foreground">
            {batches.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No inventory records yet.
                </td>
              </tr>
            )}
            {batches.map((batch, i) => {
              const statusCfg = STATUS_CONFIG[batch.status] ?? {
                className: "bg-muted text-muted-foreground",
              };

              return (
                <tr
                  key={`${batch.id}-${batch.collectionDate ?? i}`}
                  className={cn(
                    "h-10 border-b border-border transition-colors hover:bg-muted",
                    i % 2 === 1 && "bg-muted/40"
                  )}
                >
                  <td className="px-4 py-2 font-mono text-xs">{batch.id}</td>
                  <td className="px-4 py-2">
                    {formatDate(batch.collectionDate)}
                  </td>
                  <td className="px-4 py-2">{batch.donorName}</td>
                  <td className="px-4 py-2">
                    {batch.program ? PROGRAM_LABELS[batch.program] ?? batch.program : "--"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold",
                        statusCfg.className
                      )}
                    >
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm">
                    {batch.volume != null ? `${batch.volume.toLocaleString()} mL` : "--"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { cn } from "@/core/utils/cn";
import Link from "next/link";

interface InventoryBatch {
  batch_id: number;
  batch_code: string;
  status: string;
  pooling_date: Date;
  collections: {
    program: string;
    donor: { first_name: string; last_name: string } | null;
  }[];
  inventory: { available_vol: number } | null;
}

const PROGRAM_LABELS: Record<string, string> = {
  SUPSUP_TODO: "Supsup Todo",
  MILKY_WAY: "Milky Way",
  MOMS_ACT: "Mom's Act",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  POOLING: {
    label: "Pooling",
    className: "bg-muted text-muted-foreground",
  },
  TESTING: {
    label: "Testing",
    className: "bg-primary/10 text-primary",
  },
  PASTEURIZED: {
    label: "Pasteurized",
    className: "bg-primary/20 text-primary",
  },
  AVAILABLE: {
    label: "Available",
    className: "bg-primary/10 text-primary",
  },
  DISPENSED: {
    label: "Dispensed",
    className: "bg-muted text-muted-foreground",
  },
  DISPOSED: {
    label: "Disposed",
    className: "bg-destructive/10 text-destructive",
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

interface InventoryTableProps {
  batches: InventoryBatch[];
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
              <th className="px-4 py-2">Batch ID</th>
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
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  No inventory records yet.
                </td>
              </tr>
            )}
            {batches.map((batch, i) => {
              const donor = batch.collections[0]?.donor;
              const donorName = donor
                ? `${donor.first_name} ${donor.last_name}`.trim()
                : "—";
              const program =
                PROGRAM_LABELS[batch.collections[0]?.program] ?? "—";
              const statusCfg = STATUS_CONFIG[batch.status] ?? {
                label: batch.status,
                className: "bg-muted text-muted-foreground",
              };
              const volume = batch.inventory?.available_vol;

              return (
                <tr
                  key={batch.batch_id}
                  className={cn(
                    "border-b border-border transition-colors hover:bg-muted h-10",
                    i % 2 === 1 && "bg-muted/40"
                  )}
                >
                  <td className="px-4 py-2 font-mono text-xs">
                    {batch.batch_code}
                  </td>
                  <td className="px-4 py-2">
                    {formatDate(batch.pooling_date)}
                  </td>
                  <td className="px-4 py-2">{donorName}</td>
                  <td className="px-4 py-2">{program}</td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold",
                        statusCfg.className
                      )}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm">
                    {volume != null ? `${volume.toLocaleString()} mL` : "—"}
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

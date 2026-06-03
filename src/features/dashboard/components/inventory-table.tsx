import { cn } from "@/core/utils/cn";

interface InventoryRow {
  batchId: string;
  collectionDate: string;
  donorName: string;
  program: string;
  status: { label: string; variant: "raw" | "passed" | "disposed" };
  volume: number;
  disposed?: boolean;
}

const rows: InventoryRow[] = [
  {
    batchId: "B-2309-01",
    collectionDate: "2023-10-24",
    donorName: "Maria Santos",
    program: "Supsup Todo",
    status: { label: "Raw", variant: "raw" },
    volume: 1200,
  },
  {
    batchId: "B-2309-02",
    collectionDate: "2023-10-23",
    donorName: "Anna Reyes",
    program: "Milky Way",
    status: { label: "Passed", variant: "passed" },
    volume: 850,
  },
  {
    batchId: "B-2309-03",
    collectionDate: "2023-10-22",
    donorName: "Luzviminda Cruz",
    program: "Mom's Act",
    status: { label: "Disposed", variant: "disposed" },
    volume: 400,
    disposed: true,
  },
  {
    batchId: "B-2309-04",
    collectionDate: "2023-10-22",
    donorName: "Grace Lee",
    program: "Supsup Todo",
    status: { label: "Passed", variant: "passed" },
    volume: 1500,
  },
];

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "raw" | "passed" | "disposed";
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold",
        variant === "raw" &&
          "border border-border bg-accent text-muted-foreground",
        variant === "passed" &&
          "bg-primary/10 text-primary",
        variant === "disposed" &&
          "bg-destructive/10 text-destructive"
      )}
    >
      {label}
    </span>
  );
}

export function InventoryTable() {
  return (
    <div className="rounded-none border border-border bg-card">
      {/* Table header */}
      <div className="flex items-center justify-between border-b border-border bg-muted p-4">
        <h3 className="text-xs leading-4 font-semibold tracking-wider text-foreground uppercase">
          Recent Milk Inventory
        </h3>
        <button className="text-xs font-medium text-primary hover:underline">
          View All
        </button>
      </div>

      {/* Table */}
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
            {rows.map((row, i) => (
              <tr
                key={row.batchId}
                className={cn(
                  "border-b border-border transition-colors hover:bg-muted",
                  i % 2 === 1 && "bg-card"
                )}
              >
                <td className="px-4 py-2 font-mono text-xs">{row.batchId}</td>
                <td className="px-4 py-2">{row.collectionDate}</td>
                <td className="px-4 py-2">{row.donorName}</td>
                <td className="px-4 py-2">{row.program}</td>
                <td className="px-4 py-2">
                  <StatusBadge
                    label={row.status.label}
                    variant={row.status.variant}
                  />
                </td>
                <td
                  className={cn(
                    "px-4 py-2 text-right font-mono text-sm",
                    row.disposed &&
                      "text-muted-foreground line-through"
                  )}
                >
                  {row.volume.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

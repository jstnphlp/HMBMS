"use client";

import { useMemo, useState, useTransition } from "react";
import type { ElementType } from "react";
import { toast } from "sonner";
import {
  Baby,
  ClipboardList,
  Clock,
  History,
  Plus,
  Search,
  User,
} from "lucide-react";
import { Badge } from "@/core/ui/badge";
import { Button } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { Checkbox } from "@/core/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/ui/dialog";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/core/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { Textarea } from "@/core/ui/textarea";
import { cn } from "@/core/utils/cn";
import { createMilkRequest, createRecipient } from "../actions";
import type { RecipientListItem, RecipientMetrics } from "../queries";

type RecipientsPageContentProps = {
  metrics: RecipientMetrics;
  recipients: RecipientListItem[];
};

function formatDate(iso: string | null) {
  if (!iso) return "--";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function statusClass(status: string) {
  if (["DRAFT", "INCOMPLETE"].includes(status)) return "bg-muted text-muted-foreground";
  if (status === "QUEUED") return "bg-amber-100 text-amber-900";
  if (status === "READY_FOR_RELEASE") return "bg-blue-100 text-blue-900";
  if (status === "PARTIALLY_FULFILLED") return "bg-orange-100 text-orange-900";
  if (status === "RELEASED") return "bg-green-100 text-green-900";
  if (status === "CANCELLED") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function firstError(result: { errors?: unknown }) {
  const errors = result.errors as Record<string, string[]> | undefined;
  return Object.values(errors ?? {}).flat()[0] ?? "Request failed.";
}

function AddRecipientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const raw = Object.fromEntries(formData.entries());

    startTransition(async () => {
      const result = await createRecipient(raw);
      if (result.success) {
        toast.success("Recipient registered.");
        onOpenChange(false);
      } else {
        toast.error(firstError(result));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-4rem)] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-12">
            <DialogTitle>Add Recipient</DialogTitle>
            <DialogDescription>
              Register the requesting parent or guardian and the beneficiary who will consume the milk.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <User className="size-4 text-primary" />
                  Recipient
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="first_name">First name</Label>
                    <Input id="first_name" name="first_name" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="middle_name">Middle name</Label>
                    <Input id="middle_name" name="middle_name" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last name</Label>
                    <Input id="last_name" name="last_name" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="contact_no">Contact no.</Label>
                    <Input id="contact_no" name="contact_no" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="relationship_to_beneficiary">Relationship</Label>
                    <Input
                      id="relationship_to_beneficiary"
                      name="relationship_to_beneficiary"
                      required
                      placeholder="Mother, father, guardian"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" required className="mt-1" />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="notes">Recipient notes</Label>
                    <Textarea id="notes" name="notes" className="mt-1" />
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-border pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Baby className="size-4 text-primary" />
                  Beneficiary
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="beneficiary_name">Baby name</Label>
                    <Input id="beneficiary_name" name="beneficiary_name" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="beneficiary_birthdate">Date of birth</Label>
                    <Input id="beneficiary_birthdate" name="beneficiary_birthdate" type="date" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="beneficiary_sex">Sex</Label>
                    <Input id="beneficiary_sex" name="beneficiary_sex" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="beneficiary_birth_weight">Birth weight</Label>
                    <Input id="beneficiary_birth_weight" name="beneficiary_birth_weight" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="beneficiary_gestational_age">Gestational age</Label>
                    <Input id="beneficiary_gestational_age" name="beneficiary_gestational_age" className="mt-1" />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="beneficiary_medical_condition">Medical condition / reason context</Label>
                    <Textarea
                      id="beneficiary_medical_condition"
                      name="beneficiary_medical_condition"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="beneficiary_notes">Beneficiary notes</Label>
                    <Textarea id="beneficiary_notes" name="beneficiary_notes" className="mt-1" />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-background px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Recipient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateRequestDialog({
  recipient,
  open,
  onOpenChange,
}: {
  recipient: RecipientListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  if (!recipient) return null;
  const currentRecipient = recipient;

  function handleSubmit(formData: FormData) {
    const raw = Object.fromEntries(formData.entries());

    startTransition(async () => {
      const result = await createMilkRequest({
        ...raw,
        recipient_id: currentRecipient.recipient_id,
        profile_complete: formData.has("profile_complete"),
        beneficiary_complete: formData.has("beneficiary_complete"),
        reason_provided: formData.has("reason_provided"),
        volume_entered: formData.has("volume_entered"),
        staff_approved: formData.has("staff_approved"),
      });

      if (result.success) {
        toast.success(result.message ?? "Milk request saved.");
        onOpenChange(false);
      } else {
        toast.error(firstError(result));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="my-8 flex max-h-[calc(100vh-4rem)] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-12">
            <DialogTitle>Create Milk Request</DialogTitle>
            <DialogDescription>
              {currentRecipient.full_name}. Complete required checklist items before queueing.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="text-sm font-semibold">Request details</div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <Label>Recipient</Label>
                    <Input value={currentRecipient.full_name} readOnly className="mt-1 bg-muted" />
                  </div>
                  <div>
                    <Label htmlFor="beneficiary_id">Beneficiary</Label>
                    <Select name="beneficiary_id" defaultValue={currentRecipient.beneficiaries[0]?.beneficiary_id.toString()}>
                      <SelectTrigger id="beneficiary_id" className="mt-1 w-full">
                        <SelectValue placeholder="Select beneficiary" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentRecipient.beneficiaries.map((beneficiary) => (
                          <SelectItem
                            key={beneficiary.beneficiary_id}
                            value={beneficiary.beneficiary_id.toString()}
                          >
                            {beneficiary.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="requested_volume">Requested volume (mL)</Label>
                    <Input id="requested_volume" name="requested_volume" type="number" min="1" step="1" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="NORMAL">
                      <SelectTrigger id="priority" className="mt-1 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="needed_by">Needed by</Label>
                    <Input id="needed_by" name="needed_by" type="date" className="mt-1" />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="reason">Reason for request</Label>
                    <Textarea id="reason" name="reason" required className="mt-1" />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea id="remarks" name="remarks" className="mt-1" />
                  </div>
                </div>
              </section>

              <section className="space-y-3 border-t border-border pt-5">
                <div className="text-sm font-semibold">Requirements checklist</div>
                <div className="grid gap-3 rounded-sm border border-border bg-muted/40 p-4 md:grid-cols-2">
                  {[
                    ["profile_complete", "Recipient profile complete"],
                    ["beneficiary_complete", "Beneficiary information complete"],
                    ["reason_provided", "Reason for request provided"],
                    ["volume_entered", "Requested volume entered"],
                    ["staff_approved", "Staff approved"],
                  ].map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 text-sm">
                      <Checkbox name={name} />
                      {label}
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-background px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DetailsPanel({
  recipient,
  open,
  onOpenChange,
  onCreateRequest,
}: {
  recipient: RecipientListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRequest: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        {recipient && (
          <>
            <SheetHeader>
              <SheetTitle>{recipient.full_name}</SheetTitle>
              <SheetDescription>
                {recipient.display_id} - {recipient.relationship_to_beneficiary}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 overflow-y-auto px-4 pb-4">
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recipient Profile
                </h3>
                <div className="rounded-sm border border-border p-3 text-sm">
                  <div>{recipient.contact_no}</div>
                  <div className="text-muted-foreground">{recipient.address}</div>
                  {recipient.notes && <p className="mt-2 text-muted-foreground">{recipient.notes}</p>}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Beneficiaries
                </h3>
                {recipient.beneficiaries.map((beneficiary) => (
                  <div key={beneficiary.beneficiary_id} className="rounded-sm border border-border p-3 text-sm">
                    <div className="font-medium">{beneficiary.name}</div>
                    <div className="text-muted-foreground">
                      DOB {formatDate(beneficiary.birthdate)} - {beneficiary.sex ?? "Sex not set"}
                    </div>
                    <div className="text-muted-foreground">
                      Birth weight {beneficiary.birth_weight ?? "--"} - AOG {beneficiary.gestational_age ?? "--"}
                    </div>
                    {beneficiary.medical_condition && (
                      <p className="mt-2 text-muted-foreground">{beneficiary.medical_condition}</p>
                    )}
                  </div>
                ))}
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Request History
                </h3>
                {recipient.requests.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No milk requests recorded.
                  </div>
                ) : (
                  recipient.requests.map((request) => (
                    <div key={request.request_id} className="rounded-sm border border-border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs">{request.request_no}</span>
                        <Badge className={statusClass(request.status)}>{request.status.replaceAll("_", " ")}</Badge>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {request.requested_volume.toLocaleString()} mL - {request.priority} - {formatDate(request.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </section>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button variant="outline" disabled>
                  <User className="size-4" />
                  Edit Recipient
                </Button>
                <Button onClick={onCreateRequest}>
                  <Plus className="size-4" />
                  Create Milk Request
                </Button>
                <Button variant="outline" disabled>
                  <History className="size-4" />
                  View History
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function RecipientsPageContent({
  metrics,
  recipients,
}: RecipientsPageContentProps) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedRecipient =
    recipients.find((recipient) => recipient.recipient_id === selectedId) ?? null;
  const metricCards: { label: string; value: number; Icon: ElementType }[] = [
    { label: "Total Recipients", value: metrics.totalRecipients, Icon: User },
    { label: "Active Requests", value: metrics.activeRequests, Icon: ClipboardList },
    { label: "Queued Requests", value: metrics.queuedRequests, Icon: Clock },
    { label: "Released This Month", value: metrics.releasedThisMonth, Icon: Baby },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipients;

    return recipients.filter((recipient) => {
      const latestStatus = recipient.latestRequest?.status ?? "NO_REQUEST";
      return [
        recipient.display_id,
        recipient.full_name,
        recipient.contact_no,
        recipient.address,
        latestStatus,
        ...recipient.beneficiaries.map((beneficiary) => beneficiary.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [recipients, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Recipients</h1>
          <p className="text-sm text-muted-foreground">
            Manage milk recipients, beneficiaries, and milk requests.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Add Recipient
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {metricCards.map(({ label, value, Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="rounded-sm border border-border bg-popover">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider">Recipient Registry</h2>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search recipients..."
              className="pl-8"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>Recipient ID</TableHead>
                <TableHead>Recipient Name</TableHead>
                <TableHead>Contact No.</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Beneficiary/Baby</TableHead>
                <TableHead>Latest Request Status</TableHead>
                <TableHead>Registered Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((recipient) => (
                <TableRow
                  key={recipient.recipient_id}
                  onClick={() => setSelectedId(recipient.recipient_id)}
                  className={cn(
                    "cursor-pointer",
                    selectedId === recipient.recipient_id && "bg-primary/10"
                  )}
                >
                  <TableCell className="font-mono text-xs">{recipient.display_id}</TableCell>
                  <TableCell className="font-medium">{recipient.full_name}</TableCell>
                  <TableCell>{recipient.contact_no}</TableCell>
                  <TableCell className="max-w-64 truncate">{recipient.address}</TableCell>
                  <TableCell>{recipient.beneficiaries[0]?.name ?? "--"}</TableCell>
                  <TableCell>
                    {recipient.latestRequest ? (
                      <Badge className={statusClass(recipient.latestRequest.status)}>
                        {recipient.latestRequest.status.replaceAll("_", " ")}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No request</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(recipient.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{recipient.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No recipients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <AddRecipientDialog open={addOpen} onOpenChange={setAddOpen} />
      <CreateRequestDialog
        recipient={selectedRecipient}
        open={requestOpen}
        onOpenChange={setRequestOpen}
      />
      <DetailsPanel
        recipient={selectedRecipient}
        open={!!selectedRecipient}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onCreateRequest={() => setRequestOpen(true)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { RecipientTable } from "./recipient-table";
import { RecipientDetailPanel } from "./recipient-detail-panel";
import { RecipientRegistrationModal } from "./recipient-registration-modal";
import { Inbox } from "lucide-react";
import type { RecipientWithStats, RecipientDetail } from "../queries";

interface RecipientRegistryProps {
  recipients: RecipientWithStats[];
  recipientDetails: Record<number, RecipientDetail>;
}

export function RecipientRegistry({
  recipients,
  recipientDetails,
}: RecipientRegistryProps) {
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(
    null
  );
  const [registrationOpen, setRegistrationOpen] = useState(false);

  const selectedDetail = selectedRecipientId
    ? recipientDetails[selectedRecipientId] ?? null
    : null;

  return (
    <>
      <div className="flex gap-6 h-[calc(100vh-13rem)] min-h-0">
        <RecipientTable
          recipients={recipients}
          selectedRecipientId={selectedRecipientId}
          onSelectRecipient={setSelectedRecipientId}
          onRegisterNew={() => setRegistrationOpen(true)}
        />

        {/* Persistent detail container */}
        <section className="col-span-4 bg-surface border border-border rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
          {selectedDetail ? (
            <RecipientDetailPanel
              recipient={selectedDetail}
              onClose={() => setSelectedRecipientId(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="size-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No Recipient Selected
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Select a recipient from the table to view their details and
                dispensing history.
              </p>
            </div>
          )}
        </section>
      </div>

      <RecipientRegistrationModal
        open={registrationOpen}
        onOpenChange={setRegistrationOpen}
      />
    </>
  );
}

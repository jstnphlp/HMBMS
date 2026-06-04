"use client";

import { useState } from "react";
import { RecipientTable } from "./recipient-table";
import { RecipientDetailPanel } from "./recipient-detail-panel";
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
    recipients.length > 0 ? recipients[0].beneficiary_id : null
  );

  const selectedDetail = selectedRecipientId
    ? recipientDetails[selectedRecipientId] ?? null
    : null;

  return (
    <div className="flex gap-6 h-[calc(100vh-13rem)] min-h-0">
      <RecipientTable
        recipients={recipients}
        selectedRecipientId={selectedRecipientId}
        onSelectRecipient={setSelectedRecipientId}
      />
      {selectedDetail && (
        <RecipientDetailPanel recipient={selectedDetail} />
      )}
    </div>
  );
}

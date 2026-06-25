"use server";

import { db } from "@/core/db";

export type RecipientRequestSummary = {
  request_id: number;
  request_no: string;
  beneficiary_id: number;
  beneficiary_name: string;
  status: string;
  priority: string;
  requested_volume: number;
  allocated_volume: number;
  released_volume: number;
  reason: string;
  needed_by: string | null;
  remarks: string | null;
  profile_complete: boolean;
  beneficiary_complete: boolean;
  reason_provided: boolean;
  volume_entered: boolean;
  staff_approved: boolean;
  cancellation_reason: string | null;
  created_at: string;
  released_at: string | null;
  cancelled_at?: string | null;
  sms_status?: string;
};

export type RecipientBeneficiarySummary = {
  beneficiary_id: number;
  name: string;
  birthdate: string | null;
  sex: string | null;
  birth_weight: string | null;
  gestational_age: string | null;
  medical_condition: string | null;
  notes: string | null;
};

export type RecipientListItem = {
  recipient_id: number;
  display_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  contact_no: string;
  address: string;
  relationship_to_beneficiary: string;
  notes: string | null;
  status: string;
  created_at: string;
  beneficiaries: RecipientBeneficiarySummary[];
  requests: RecipientRequestSummary[];
  latestRequest: RecipientRequestSummary | null;
};

export type RecipientMetrics = {
  totalRecipients: number;
  activeRequests: number;
  queuedRequests: number;
  releasedThisMonth: number;
};

function recipientDisplayId(id: number) {
  return `REC-${String(id).padStart(4, "0")}`;
}

function fullName(recipient: {
  first_name: string;
  middle_name: string | null;
  last_name: string;
}) {
  return [recipient.first_name, recipient.middle_name, recipient.last_name]
    .filter(Boolean)
    .join(" ");
}

export async function getRecipientMetrics(): Promise<RecipientMetrics> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRecipients, activeRequests, queuedRequests, releasedThisMonth] =
    await Promise.all([
      db.recipient.count(),
      db.milkRequest.count({
        where: {
          status: { in: ["QUEUED", "READY_FOR_RELEASE", "PARTIALLY_FULFILLED"] },
        },
      }),
      db.milkRequest.count({ where: { status: "QUEUED" } }),
      db.milkRequest.count({
        where: {
          status: "RELEASED",
          released_at: { gte: monthStart },
        },
      }),
    ]);

  return {
    totalRecipients,
    activeRequests,
    queuedRequests,
    releasedThisMonth,
  };
}

export async function getRecipients(): Promise<RecipientListItem[]> {
  const recipients = await db.recipient.findMany({
    take: 100,
    orderBy: { created_at: "desc" },
    include: {
      beneficiaries: { orderBy: { created_at: "desc" } },
      milkRequests: {
        orderBy: { created_at: "desc" },
        take: 10,
        select: {
          request_id: true,
          request_no: true,
          beneficiary_id: true,
          beneficiary: { select: { name: true } },
          status: true,
          priority: true,
          requested_volume: true,
          allocated_volume: true,
          released_volume: true,
          reason: true,
          needed_by: true,
          remarks: true,
          profile_complete: true,
          beneficiary_complete: true,
          reason_provided: true,
          volume_entered: true,
          staff_approved: true,
          cancellation_reason: true,
          created_at: true,
          released_at: true,
        },
      },
    },
  });

  return recipients.map((recipient) => {
    const requests = recipient.milkRequests.map((request) => ({
      request_id: request.request_id,
      request_no: request.request_no,
      beneficiary_id: request.beneficiary_id,
      beneficiary_name: request.beneficiary.name,
      status: request.status,
      priority: request.priority,
      requested_volume: request.requested_volume,
      allocated_volume: request.allocated_volume,
      released_volume: request.released_volume,
      reason: request.reason,
      needed_by: request.needed_by?.toISOString() ?? null,
      remarks: request.remarks,
      profile_complete: request.profile_complete,
      beneficiary_complete: request.beneficiary_complete,
      reason_provided: request.reason_provided,
      volume_entered: request.volume_entered,
      staff_approved: request.staff_approved,
      cancellation_reason: request.cancellation_reason,
      created_at: request.created_at.toISOString(),
      released_at: request.released_at?.toISOString() ?? null,
    }));

    return {
      recipient_id: recipient.recipient_id,
      display_id: recipientDisplayId(recipient.recipient_id),
      first_name: recipient.first_name,
      middle_name: recipient.middle_name,
      last_name: recipient.last_name,
      full_name: fullName(recipient),
      contact_no: recipient.contact_no,
      address: recipient.address,
      relationship_to_beneficiary: recipient.relationship_to_beneficiary,
      notes: recipient.notes,
      status: recipient.status,
      created_at: recipient.created_at.toISOString(),
      beneficiaries: recipient.beneficiaries.map((beneficiary) => ({
        beneficiary_id: beneficiary.beneficiary_id,
        name: beneficiary.name,
        birthdate: beneficiary.birthdate?.toISOString() ?? null,
        sex: beneficiary.sex,
        birth_weight: beneficiary.birth_weight,
        gestational_age: beneficiary.gestational_age,
        medical_condition: beneficiary.medical_condition,
        notes: beneficiary.notes ?? beneficiary.remarks,
      })),
      requests,
      latestRequest: requests[0] ?? null,
    };
  });
}

"use server";

import { db } from "@/core/db";
import { DonorStatus, Program } from "@/generated/prisma/enums";
import type {
  DonorEligibilitySummary,
  SupsupTodoWorkflowDetail,
} from "@/features/supsup-todo/queries";
import { getDonorSupsupTodoSummary } from "@/features/supsup-todo/queries";

export interface DonorWithStats {
  donor_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  contact_no: string;
  address: string;
  civil_status: string;
  birthdate: Date;
  religion: string | null;
  occupation: string | null;
  spouse_name: string | null;
  spouse_occupation: string | null;
  spouse_contact_no: string | null;
  delivery_date: Date | null;
  delivery_place: string | null;
  delivery_type: string | null;
  aog: string | null;
  pregnancy_delivery_details: string | null;
  infant_name: string | null;
  infant_birthdate: Date | null;
  infant_sex: string | null;
  infant_birth_weight: string | null;
  infant_details: string | null;
  status: "ACTIVE" | "INACTIVE";
  registration: Date;
  program: string | null;
  total_volume: number;
  donation_count: number;
  last_donation: Date | null;
}

export interface DonorDetail extends DonorWithStats {
  collections: {
    ctn: number;
    collection_date: Date;
    volume: number;
    program: string;
    remarks: string | null;
    recorded_by_name: string;
    is_pasteurized: boolean;
    status: string;
    batch_no: string | null;
    bottle_no: string | null;
    expiration_date: Date | null;
    dtn: string | null;
    aob: string | null;
    collected_by: string | null;
    batch: {
      batch_code: string;
      status: string;
    } | null;
  }[];
  supSupTodoEligibility: DonorEligibilitySummary;
  supSupTodoWorkflows: SupsupTodoWorkflowDetail[];
}

export interface DonorMetrics {
  total_donors: number;
  active_donors: number;
  inactive_donors: number;
  new_this_month: number;
}

export async function getDonorsWithStats(
  searchQuery?: string
): Promise<DonorWithStats[]> {
  const normalizedQuery = searchQuery?.trim();
  const numericDonorId = normalizedQuery
    ? Number(normalizedQuery.match(/\d+/g)?.join("") ?? NaN)
    : NaN;
  const statusMatch = normalizedQuery
    ? donorStatusFromSearch(normalizedQuery)
    : null;
  const programMatch = normalizedQuery
    ? programFromSearch(normalizedQuery)
    : null;
  const dateRange = normalizedQuery ? dateRangeFromSearch(normalizedQuery) : null;
  const nameTerms = normalizedQuery
    ? normalizedQuery.split(/\s+/).filter(Boolean)
    : [];

  const where = normalizedQuery
    ? {
        OR: [
          { first_name: { contains: normalizedQuery, mode: "insensitive" as const } },
          { middle_name: { contains: normalizedQuery, mode: "insensitive" as const } },
          { last_name: { contains: normalizedQuery, mode: "insensitive" as const } },
          ...(nameTerms.length > 1
            ? [
                {
                  AND: nameTerms.map((term) => ({
                    OR: [
                      { first_name: { contains: term, mode: "insensitive" as const } },
                      { middle_name: { contains: term, mode: "insensitive" as const } },
                      { last_name: { contains: term, mode: "insensitive" as const } },
                    ],
                  })),
                },
              ]
            : []),
          { address: { contains: normalizedQuery, mode: "insensitive" as const } },
          { contact_no: { contains: normalizedQuery } },
          { civil_status: { contains: normalizedQuery, mode: "insensitive" as const } },
          ...(Number.isNaN(numericDonorId)
            ? []
            : [{ donor_id: numericDonorId }]),
          ...(statusMatch ? [{ status: statusMatch }] : []),
          ...(programMatch
            ? [{ collections: { some: { program: programMatch } } }]
            : []),
          ...(dateRange
            ? [
                { birthdate: { gte: dateRange.start, lt: dateRange.end } },
                { registration: { gte: dateRange.start, lt: dateRange.end } },
              ]
            : []),
        ],
      }
    : {};

  const donors = await db.donor.findMany({
    where,
    take: 25,
    select: {
      donor_id: true,
      first_name: true,
      middle_name: true,
      last_name: true,
      contact_no: true,
      address: true,
      civil_status: true,
      birthdate: true,
      religion: true,
      occupation: true,
      spouse_name: true,
      spouse_occupation: true,
      spouse_contact_no: true,
      delivery_date: true,
      delivery_place: true,
      delivery_type: true,
      aog: true,
      pregnancy_delivery_details: true,
      infant_name: true,
      infant_birthdate: true,
      infant_sex: true,
      infant_birth_weight: true,
      infant_details: true,
      status: true,
      registration: true,
    },
    orderBy: { registration: "desc" },
  });

  const donorIds = donors.map((donor) => donor.donor_id);

  const [collectionStats, latestCollections] = donorIds.length
    ? await Promise.all([
        db.collection.groupBy({
          by: ["donor_id"],
          where: { donor_id: { in: donorIds } },
          _sum: { volume: true },
          _count: true,
        }),
        db.collection.findMany({
          where: { donor_id: { in: donorIds } },
          select: {
            donor_id: true,
            program: true,
            collection_date: true,
          },
          orderBy: { collection_date: "desc" },
        }),
      ])
    : [[], []];

  const statsByDonor = new Map(
    collectionStats.map((stat) => [
      stat.donor_id,
      {
        total_volume: stat._sum.volume ?? 0,
        donation_count: stat._count,
      },
    ])
  );
  const latestByDonor = new Map<number, (typeof latestCollections)[number]>();

  for (const collection of latestCollections) {
    if (!latestByDonor.has(collection.donor_id)) {
      latestByDonor.set(collection.donor_id, collection);
    }
  }

  return donors.map((donor) => {
    const stats = statsByDonor.get(donor.donor_id);
    const lastCollection = latestByDonor.get(donor.donor_id) ?? null;

    return {
      donor_id: donor.donor_id,
      first_name: donor.first_name,
      middle_name: donor.middle_name,
      last_name: donor.last_name,
      contact_no: donor.contact_no,
      address: donor.address,
      civil_status: donor.civil_status,
      birthdate: donor.birthdate,
      religion: donor.religion,
      occupation: donor.occupation,
      spouse_name: donor.spouse_name,
      spouse_occupation: donor.spouse_occupation,
      spouse_contact_no: donor.spouse_contact_no,
      delivery_date: donor.delivery_date,
      delivery_place: donor.delivery_place,
      delivery_type: donor.delivery_type,
      aog: donor.aog,
      pregnancy_delivery_details: donor.pregnancy_delivery_details,
      infant_name: donor.infant_name,
      infant_birthdate: donor.infant_birthdate,
      infant_sex: donor.infant_sex,
      infant_birth_weight: donor.infant_birth_weight,
      infant_details: donor.infant_details,
      status: donor.status,
      registration: donor.registration,
      program: lastCollection?.program ?? null,
      total_volume: stats?.total_volume ?? 0,
      donation_count: stats?.donation_count ?? 0,
      last_donation: lastCollection?.collection_date ?? null,
    };
  });
}

function donorStatusFromSearch(searchQuery: string) {
  const normalized = searchQuery.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (normalized === "ACTIVE") return DonorStatus.ACTIVE;
  if (normalized === "INACTIVE") return DonorStatus.INACTIVE;
  return null;
}

function programFromSearch(searchQuery: string) {
  const normalized = searchQuery
    .trim()
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/[\s-]+/g, "_");

  if (normalized === "SUPSUP" || normalized === "SUPSUP_TODO") {
    return Program.SUPSUP_TODO;
  }
  if (normalized === "MILKY" || normalized === "MILKY_WAY") {
    return Program.MILKY_WAY;
  }
  if (normalized === "MOMS" || normalized === "MOMS_ACT") {
    return Program.MOMS_ACT;
  }

  return null;
}

function dateRangeFromSearch(searchQuery: string) {
  const parsed = new Date(searchQuery);
  if (Number.isNaN(parsed.getTime())) return null;

  const start = new Date(parsed);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function getDonorById(
  donorId: number
): Promise<DonorDetail | null> {
  const donor = await db.donor.findUnique({
    where: { donor_id: donorId },
    include: {
      collections: {
        orderBy: { collection_date: "desc" },
        include: { batch: true, recorder: { select: { user_id: true, email: true, full_name: true } } },
      },
    },
  });

  if (!donor) return null;

  const totalVolume = donor.collections.reduce(
    (sum, c) => sum + c.volume,
    0
  );
  const lastCollection = donor.collections[0] ?? null;
  const supSupTodoSummary = await getDonorSupsupTodoSummary(donorId);

  return {
    donor_id: donor.donor_id,
    first_name: donor.first_name,
    middle_name: donor.middle_name,
    last_name: donor.last_name,
    contact_no: donor.contact_no,
    address: donor.address,
    civil_status: donor.civil_status,
    birthdate: donor.birthdate,
    religion: donor.religion,
    occupation: donor.occupation,
    spouse_name: donor.spouse_name,
    spouse_occupation: donor.spouse_occupation,
    spouse_contact_no: donor.spouse_contact_no,
    delivery_date: donor.delivery_date,
    delivery_place: donor.delivery_place,
    delivery_type: donor.delivery_type,
    aog: donor.aog,
    pregnancy_delivery_details: donor.pregnancy_delivery_details,
    infant_name: donor.infant_name,
    infant_birthdate: donor.infant_birthdate,
    infant_sex: donor.infant_sex,
    infant_birth_weight: donor.infant_birth_weight,
    infant_details: donor.infant_details,
    status: donor.status,
    registration: donor.registration,
    program: lastCollection?.program ?? null,
    total_volume: totalVolume,
    donation_count: donor.collections.length,
    last_donation: lastCollection?.collection_date ?? null,
    collections: donor.collections.map((c) => ({
      ctn: c.ctn,
      collection_date: c.collection_date,
      volume: c.volume,
      program: c.program,
      remarks: c.remarks,
      recorded_by_name: c.recorder.email,
      is_pasteurized: c.is_pasteurized,
      status: c.status,
      batch_no: c.batch_no,
      bottle_no: c.bottle_no,
      expiration_date: c.expiration_date,
      dtn: c.dtn,
      aob: c.aob,
      collected_by: c.collected_by,
      batch: c.batch
        ? { batch_code: c.batch.batch_code, status: c.batch.status }
        : null,
    })),
    supSupTodoEligibility: supSupTodoSummary.eligibility,
    supSupTodoWorkflows: supSupTodoSummary.workflows,
  };
}

export async function getDonorMetrics(): Promise<DonorMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, active, inactive, newThisMonth] = await Promise.all([
    db.donor.count(),
    db.donor.count({ where: { status: "ACTIVE" } }),
    db.donor.count({ where: { status: "INACTIVE" } }),
    db.donor.count({ where: { registration: { gte: startOfMonth } } }),
  ]);

  return {
    total_donors: total,
    active_donors: active,
    inactive_donors: inactive,
    new_this_month: newThisMonth,
  };
}

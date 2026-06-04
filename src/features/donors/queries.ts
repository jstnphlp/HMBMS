"use server";

import { db } from "@/core/db";

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
  const where = searchQuery
    ? {
        OR: [
          { first_name: { contains: searchQuery, mode: "insensitive" as const } },
          { last_name: { contains: searchQuery, mode: "insensitive" as const } },
          { contact_no: { contains: searchQuery } },
          ...(isNaN(Number(searchQuery))
            ? []
            : [{ donor_id: Number(searchQuery) }]),
        ],
      }
    : {};

  const donors = await db.donor.findMany({
    where,
    include: {
      collections: {
        orderBy: { collection_date: "desc" },
        include: { batch: true },
      },
    },
    orderBy: { registration: "desc" },
  });

  return donors.map((donor) => {
    const totalVolume = donor.collections.reduce(
      (sum, c) => sum + c.volume,
      0
    );
    const lastCollection = donor.collections[0] ?? null;

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
      status: donor.status,
      registration: donor.registration,
      program: lastCollection?.program ?? null,
      total_volume: totalVolume,
      donation_count: donor.collections.length,
      last_donation: lastCollection?.collection_date ?? null,
    };
  });
}

export async function getDonorById(
  donorId: number
): Promise<DonorDetail | null> {
  const donor = await db.donor.findUnique({
    where: { donor_id: donorId },
    include: {
      collections: {
        orderBy: { collection_date: "desc" },
        include: { batch: true, recorder: true },
      },
    },
  });

  if (!donor) return null;

  const totalVolume = donor.collections.reduce(
    (sum, c) => sum + c.volume,
    0
  );
  const lastCollection = donor.collections[0] ?? null;

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

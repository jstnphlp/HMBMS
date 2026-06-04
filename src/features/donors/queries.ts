"use server";

import { db } from "@/core/db";

export interface DonorWithStats {
  donor_id: number;
  first_name: string;
  last_name: string;
  contact_no: string;
  address: string;
  civil_status: string;
  birthdate: Date;
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

export async function getDonorsWithStats(): Promise<DonorWithStats[]> {
  const donors = await db.donor.findMany({
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
      last_name: donor.last_name,
      contact_no: donor.contact_no,
      address: donor.address,
      civil_status: donor.civil_status,
      birthdate: donor.birthdate,
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
        include: { batch: true },
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
    last_name: donor.last_name,
    contact_no: donor.contact_no,
    address: donor.address,
    civil_status: donor.civil_status,
    birthdate: donor.birthdate,
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

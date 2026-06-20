import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SEED_EMAIL = "admin@makatimilkbank.gov";
const SEED_PASSWORD = "Admin@1234";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // ── 1. Clean all tables in FK-safe order ──────────────────────────────
  console.log("Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.sMS.deleteMany();
  await prisma.dispensing.deleteMany();
  await prisma.disposal.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.user.deleteMany();

  // ── 2. Auth user (admin) ──────────────────────────────────────────────
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      email_confirm: true,
    });

  let authId: string;

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log(`Auth user ${SEED_EMAIL} already exists, fetching...`);
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData.users.find((u) => u.email === SEED_EMAIL);
      if (!existing) throw new Error("Could not find existing auth user");
      authId = existing.id;
    } else {
      throw authError;
    }
  } else {
    authId = authData.user.id;
    console.log(`Created auth user: ${SEED_EMAIL} (${authId})`);
  }

  // ── 3. Users ──────────────────────────────────────────────────────────
  console.log("Creating users...");
  const admin = await prisma.user.create({
    data: { auth_id: authId, email: SEED_EMAIL, role: "ADMIN", full_name: "Administrator" },
  });

  const staff1 = await prisma.user.create({
    data: {
      auth_id: `seed-staff-1-${Date.now()}`,
      email: "staff.maria@makatimilkbank.gov",
      role: "STAFF",
      full_name: "Maria Santos",
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      auth_id: `seed-staff-2-${Date.now()}`,
      email: "staff.ana@makatimilkbank.gov",
      role: "STAFF",
      full_name: "Ana Reyes",
    },
  });

  console.log(`  Created ${[admin, staff1, staff2].length} users`);

  // ── 4. Donors ─────────────────────────────────────────────────────────
  console.log("Creating donors...");
  const donor1 = await prisma.donor.create({
    data: {
      user_id: admin.user_id,
      first_name: "Maria",
      middle_name: "Santos",
      last_name: "Dela Cruz",
      birthdate: new Date("1992-03-15"),
      address: "123 Rizal Street, Brgy. Poblacion, Makati City",
      contact_no: "09171234567",
      civil_status: "Married",
      religion: "Catholic",
      occupation: "Nurse",
      spouse_name: "Juan Dela Cruz",
      spouse_occupation: "Engineer",
      spouse_contact_no: "09181234567",
      delivery_date: daysAgo(45),
      delivery_place: "Makati Medical Center",
      delivery_type: "Normal",
      aog: "38 weeks",
      infant_name: "Baby Sofia",
      infant_birthdate: daysAgo(45),
      infant_sex: "Female",
      infant_birth_weight: "3.2 kg",
      status: "ACTIVE",
      registration: daysAgo(60),
    },
  });

  const donor2 = await prisma.donor.create({
    data: {
      user_id: admin.user_id,
      first_name: "Ana",
      middle_name: null,
      last_name: "Reyes",
      birthdate: new Date("1988-07-22"),
      address: "456 Aguinaldo Highway, Brgy. San Antonio, Makati City",
      contact_no: "09172345678",
      civil_status: "Married",
      religion: "Christian",
      occupation: "Teacher",
      spouse_name: "Pedro Reyes",
      spouse_occupation: "Driver",
      spouse_contact_no: "09182345678",
      delivery_date: daysAgo(30),
      delivery_place: "Ospital ng Makati",
      delivery_type: "Cesarean",
      aog: "36 weeks",
      infant_name: "Baby Mateo",
      infant_birthdate: daysAgo(30),
      infant_sex: "Male",
      infant_birth_weight: "2.8 kg",
      status: "ACTIVE",
      registration: daysAgo(90),
    },
  });

  const donor3 = await prisma.donor.create({
    data: {
      user_id: staff1.user_id,
      first_name: "Carmen",
      middle_name: "Garcia",
      last_name: "Villanueva",
      birthdate: new Date("1995-11-08"),
      address: "789 JP Rizal Extension, Brgy. Guadalupe, Makati City",
      contact_no: "09173456789",
      civil_status: "Single",
      religion: "Iglesia",
      occupation: "Accountant",
      spouse_name: null,
      spouse_occupation: null,
      spouse_contact_no: null,
      delivery_date: daysAgo(120),
      delivery_place: "Makati Medical Center",
      delivery_type: "Normal",
      aog: "40 weeks",
      infant_name: "Baby Lucia",
      infant_birthdate: daysAgo(120),
      infant_sex: "Female",
      infant_birth_weight: "3.5 kg",
      status: "INACTIVE",
      registration: daysAgo(150),
    },
  });

  console.log(`  Created 3 donors`);

  // ── 5. Beneficiaries ──────────────────────────────────────────────────
  console.log("Creating beneficiaries...");
  const ben1 = await prisma.beneficiary.create({
    data: {
      name: "Baby Sofia Dela Cruz",
      contact_no: "09175678901",
      remarks: "NICU patient, premature twin A",
    },
  });

  const ben2 = await prisma.beneficiary.create({
    data: {
      name: "Baby Mateo Reyes",
      contact_no: "09176789012",
      remarks: "Outpatient, low birth weight infant",
    },
  });

  const ben3 = await prisma.beneficiary.create({
    data: {
      name: "Makati General Hospital NICU",
      contact_no: "09177890123",
      remarks: null,
    },
  });

  console.log(`  Created 3 beneficiaries`);

  // ── 6. Batches ────────────────────────────────────────────────────────
  console.log("Creating batches...");
  const batch1 = await prisma.batch.create({
    data: {
      batch_code: "BATCH-2024-001",
      pooling_date: daysAgo(10),
      total_volume: 450,
      remaining_volume: 450,
      status: "AVAILABLE",
      created_by: admin.user_id,
    },
  });

  const batch2 = await prisma.batch.create({
    data: {
      batch_code: "BATCH-2024-002",
      pooling_date: daysAgo(3),
      total_volume: 300,
      remaining_volume: 300,
      status: "TESTING",
      created_by: staff1.user_id,
    },
  });

  const batch3 = await prisma.batch.create({
    data: {
      batch_code: "BATCH-2024-003",
      pooling_date: daysAgo(1),
      total_volume: 200,
      remaining_volume: 200,
      status: "POOLING",
      created_by: admin.user_id,
    },
  });

  console.log(`  Created 3 batches`);

  // ── 7. Collections ────────────────────────────────────────────────────
  console.log("Creating collections...");
  const col1 = await prisma.collection.create({
    data: {
      donor_id: donor1.donor_id,
      recorded_by: admin.user_id,
      program: "SUPSUP_TODO",
      collection_date: daysAgo(12),
      volume: 180,
      remarks: "Frozen, good condition",
      is_pasteurized: true,
      status: "READY_FOR_DISPENSING",
      batch_no: "BATCH-2024-001",
      bottle_no: `BT-${Date.now()}-A1B2`,
      expiration_date: daysAgo(-90),
      batch_id: batch1.batch_id,
    },
  });

  const col2 = await prisma.collection.create({
    data: {
      donor_id: donor2.donor_id,
      recorded_by: staff1.user_id,
      program: "MILKY_WAY",
      collection_date: daysAgo(5),
      volume: 150,
      remarks: "Fresh, room temperature",
      is_pasteurized: false,
      status: "PENDING_LAB_TEST",
      dtn: "DTN-2024-001",
      aob: "2 months",
      collected_by: "Nurse Santos",
      batch_id: batch2.batch_id,
    },
  });

  const col3 = await prisma.collection.create({
    data: {
      donor_id: donor3.donor_id,
      recorded_by: staff2.user_id,
      program: "MOMS_ACT",
      collection_date: daysAgo(2),
      volume: 120,
      remarks: "Frozen",
      is_pasteurized: false,
      status: "PENDING_LAB_TEST",
      dtn: "DTN-2024-002",
      aob: "4 months",
      collected_by: "Midwife Cruz",
      batch_id: batch3.batch_id,
    },
  });

  console.log(`  Created 3 collections`);

  // ── 8. Lab Results ────────────────────────────────────────────────────
  console.log("Creating lab results...");
  await prisma.labResult.create({
    data: {
      batch_id: batch1.batch_id,
      stage: "PRE_PASTEURIZATION",
      test_date: daysAgo(9),
      result: "PASS",
      tested_by: staff1.user_id,
      remarks: "All parameters within normal range",
    },
  });

  await prisma.labResult.create({
    data: {
      batch_id: batch1.batch_id,
      stage: "POST_PASTEURIZATION",
      test_date: daysAgo(8),
      result: "PASS",
      tested_by: staff1.user_id,
      remarks: "Pasteurization successful, ready for dispensing",
    },
  });

  await prisma.labResult.create({
    data: {
      batch_id: batch2.batch_id,
      stage: "PRE_PASTEURIZATION",
      test_date: daysAgo(2),
      result: "PENDING",
      tested_by: staff2.user_id,
      remarks: "Awaiting test results",
    },
  });

  console.log(`  Created 3 lab results`);

  // ── 9. Inventory ──────────────────────────────────────────────────────
  console.log("Creating inventory...");
  await prisma.inventory.create({
    data: {
      batch_id: batch1.batch_id,
      donated_vol: 450,
      pasteurized_vol: 430,
      available_vol: 350,
      updated_by: admin.user_id,
    },
  });

  await prisma.inventory.create({
    data: {
      batch_id: batch2.batch_id,
      donated_vol: 300,
      pasteurized_vol: 0,
      available_vol: 300,
      updated_by: staff1.user_id,
    },
  });

  await prisma.inventory.create({
    data: {
      batch_id: batch3.batch_id,
      donated_vol: 200,
      pasteurized_vol: 0,
      available_vol: 200,
      updated_by: admin.user_id,
    },
  });

  console.log(`  Created 3 inventory records`);

  // ── 10. Dispensings ───────────────────────────────────────────────────
  console.log("Creating dispensings...");
  await prisma.dispensing.create({
    data: {
      batch_id: batch1.batch_id,
      beneficiary_id: ben1.beneficiary_id,
      dispensed_by: admin.user_id,
      dispensing_date: daysAgo(5),
      volume: 50,
      price: 100,
      total: 5000,
      remarks: "NICU supply for twin A",
    },
  });

  await prisma.dispensing.create({
    data: {
      batch_id: batch1.batch_id,
      beneficiary_id: ben2.beneficiary_id,
      dispensed_by: staff1.user_id,
      dispensing_date: daysAgo(3),
      volume: 50,
      price: 100,
      total: 5000,
      remarks: "Weekly outpatient supply",
    },
  });

  await prisma.dispensing.create({
    data: {
      batch_id: batch1.batch_id,
      beneficiary_id: ben3.beneficiary_id,
      dispensed_by: admin.user_id,
      dispensing_date: daysAgo(1),
      volume: 30,
      price: 100,
      total: 3000,
      remarks: null,
    },
  });

  console.log(`  Created 3 dispensings`);

  // ── 11. Disposals ─────────────────────────────────────────────────────
  console.log("Creating disposals...");
  await prisma.disposal.create({
    data: {
      batch_id: batch1.batch_id,
      disposal_date: daysAgo(6),
      reason: "Expired stock",
      volume: 20,
      disposed_by: staff1.user_id,
      remarks: "Past expiration date, disposed per protocol",
    },
  });

  await prisma.disposal.create({
    data: {
      batch_id: batch2.batch_id,
      disposal_date: daysAgo(4),
      reason: "Contamination suspected",
      volume: 10,
      disposed_by: admin.user_id,
      remarks: "Temperature excursion during transport",
    },
  });

  await prisma.disposal.create({
    data: {
      batch_id: batch3.batch_id,
      disposal_date: daysAgo(1),
      reason: "Damaged container",
      volume: 5,
      disposed_by: staff2.user_id,
      remarks: "Bottle cracked during handling",
    },
  });

  console.log(`  Created 3 disposals`);

  // ── 12. SMS ───────────────────────────────────────────────────────────
  console.log("Creating SMS records...");
  await prisma.sMS.create({
    data: {
      beneficiary_id: ben1.beneficiary_id,
      message: "Your milk supply is ready for pickup at Makati Milk Bank.",
      status: "SENT",
      scheduled_at: daysAgo(5),
      sent_at: daysAgo(5),
      retry: 0,
    },
  });

  await prisma.sMS.create({
    data: {
      beneficiary_id: ben2.beneficiary_id,
      message: "Reminder: Your next scheduled pickup is on Monday.",
      status: "PENDING",
      scheduled_at: daysAgo(-2),
      sent_at: null,
      retry: 0,
    },
  });

  await prisma.sMS.create({
    data: {
      beneficiary_id: ben3.beneficiary_id,
      message: "Milk supply allocation confirmed. Please bring valid ID.",
      status: "FAILED",
      scheduled_at: daysAgo(1),
      sent_at: null,
      retry: 2,
    },
  });

  console.log(`  Created 3 SMS records`);

  // ── 13. Audit Logs ────────────────────────────────────────────────────
  console.log("Creating audit logs...");
  await prisma.auditLog.create({
    data: {
      user_id: admin.user_id,
      action_details: "Registered new donor: Maria Dela Cruz (D-0001)",
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: staff1.user_id,
      action_details: "Recorded unpasteurized drop-off (150 mL) for donor #2, routed to lab as batch BATCH-2024-002",
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: admin.user_id,
      action_details: "Dispensed 50 mL from batch BATCH-2024-001 to beneficiary #1",
    },
  });

  console.log(`  Created 3 audit logs`);

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════");
  console.log("  Seed Complete — Summary");
  console.log("══════════════════════════════════════════");
  console.log(`  Users:         3 (1 ADMIN, 2 STAFF)`);
  console.log(`  Donors:        3 (2 ACTIVE, 1 INACTIVE)`);
  console.log(`  Beneficiaries: 3`);
  console.log(`  Batches:       3 (AVAILABLE, TESTING, POOLING)`);
  console.log(`  Collections:   3 (1 pasteurized, 2 unpasteurized)`);
  console.log(`  Lab Results:   3 (2 PASS, 1 PENDING)`);
  console.log(`  Inventory:     3`);
  console.log(`  Dispensings:   3`);
  console.log(`  Disposals:     3`);
  console.log(`  SMS:           3 (SENT, PENDING, FAILED)`);
  console.log(`  Audit Logs:    3`);
  console.log("══════════════════════════════════════════");
  console.log(`\n  Admin Login:`);
  console.log(`    Email:    ${SEED_EMAIL}`);
  console.log(`    Password: ${SEED_PASSWORD}`);
  console.log(`    Role:     ADMIN`);
  console.log("══════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

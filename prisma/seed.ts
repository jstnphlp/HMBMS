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

async function main() {
  console.log("Seeding database...");

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
      if (!existing) {
        throw new Error("Could not find existing auth user");
      }
      authId = existing.id;
    } else {
      throw authError;
    }
  } else {
    authId = authData.user.id;
    console.log(`Created auth user: ${SEED_EMAIL} (${authId})`);
  }

  const dbUser = await prisma.user.upsert({
    where: { auth_id: authId },
    update: { email: SEED_EMAIL, role: "ADMIN" },
    create: {
      auth_id: authId,
      email: SEED_EMAIL,
      role: "ADMIN",
    },
  });

  console.log(`Upserted DB user: ${dbUser.email} (${dbUser.role})`);
  console.log("\n--- Seed Complete ---");
  console.log(`Email:    ${SEED_EMAIL}`);
  console.log(`Password: ${SEED_PASSWORD}`);
  console.log(`Role:     ADMIN`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

# Human Milk Bank Management System (HMBMS)

A web-based management system for Makati Milk Bank to digitize operations across three milk collection programs: **Supsup Todo**, **Milky Way**, and **Mom's Act**.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Database:** PostgreSQL (Supabase Postgres, Docker local)
- **ORM:** Prisma 7.8 (with `@prisma/adapter-pg` driver adapter)
- **UI Components:** shadcn/ui (New York style)
- **Styling:** Tailwind CSS v4 (CSS variables, oklch)
- **Language:** TypeScript (strict mode)
- **Architecture:** Feature-Sliced Design (FSD)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- npm

### 1. Clone the Repository

```bash
git clone <repo-url>
cd HMBMS
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/hmbms_local?schema=public"
```

> **Note:** The database credentials and connection string must match your local PostgreSQL setup. See [Database Setup](#database-setup) below for options.

### 3. Start the Local Database

#### Option A: Docker Compose (Recommended)

```bash
docker compose up -d
```

This spins up a PostgreSQL instance on `localhost:5432` with database `hmbms_local` and password `postgres`.

#### Option B: Supabase CLI

If you have the [Supabase CLI](https://supabase.com/docs/guides/local-development) installed:

```bash
supabase start
```

This starts the full Supabase stack. Use port `54322` for direct PostgreSQL access:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres?schema=public"
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Apply Database Migrations

```bash
npx prisma migrate dev
```

This applies all tracked migrations to your local database and generates the Prisma client. You only need to run this once after cloning, or after pulling changes that include new migrations.

### 6. Start the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Database Migrations

This project uses **Prisma Migrate** to track schema changes. Migration files are committed to git in `prisma/migrations/` so every collaborator can apply schema changes consistently.

### For Collaborators (After Pulling Changes)

When you pull changes that include new migrations:

```bash
npx prisma migrate dev
```

This applies any pending migrations and regenerates the Prisma client.

### Creating a New Migration

When you modify `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name descriptive_name
```

This creates a new timestamped migration folder in `prisma/migrations/`, applies it to your dev database, and regenerates the Prisma client.

**Migration naming conventions:**
- Use snake_case: `add_donor_email_verified_field`
- Be descriptive: `create_inventory_table`, not `update`
- Prefix with the action: `add_`, `remove_`, `alter_`, `create_`

### Deploying Migrations (CI / Production)

```bash
npx prisma migrate deploy
```

This applies all pending migrations without generating new ones. Use this in deployment scripts and CI pipelines.

### Useful Prisma Commands

| Command | Description |
|---|---|
| `npx prisma migrate dev` | Apply migrations + generate client (dev workflow) |
| `npx prisma migrate dev --name <name>` | Create and apply a new named migration |
| `npx prisma migrate deploy` | Apply pending migrations (CI/production) |
| `npx prisma migrate status` | Show migration status |
| `npx prisma studio` | Open Prisma Studio (visual DB browser) |
| `npx prisma format` | Format the schema file |
| `npx prisma generate` | Regenerate the Prisma client |
| `npx prisma validate` | Validate the schema file |

---

## Project Structure (Feature-Sliced Design)

```
src/
├── app/                        # Next.js App Router (route wrappers only)
│   ├── (auth)/                 # Auth-related pages (login, register)
│   ├── dashboard/              # Dashboard pages
│   ├── api/                    # API routes
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles + shadcn theme
├── core/                       # Shared, non-domain code
│   ├── db/
│   │   └── index.ts            # Prisma client singleton (DO NOT EDIT)
│   ├── ui/                     # Raw shadcn/ui components (CLI-managed)
│   └── utils/
│       └── cn.ts               # clsx + tailwind-merge utility
└── features/                   # Domain feature modules
    ├── donors/
    │   ├── actions.ts          # Server actions (mutations)
    │   ├── queries.ts          # Database queries (read-only)
    │   ├── schemas.ts          # Zod validation schemas
    │   └── components/         # Donor-specific UI components
    ├── collections/
    ├── laboratory/
    ├── inventory/
    ├── dispensing/
    ├── disposal/
    ├── sms/
    └── audit/
```

### How FSD Works Here

- **`src/core/`** — Shared infrastructure (database client, UI primitives, utilities). Never import from `features/` here.
- **`src/features/<domain>/`** — Each feature is an isolated domain slice containing:
  - `actions.ts` — Server actions (mutations) for that domain
  - `queries.ts` — Read-only database queries for that domain
  - `schemas.ts` — Zod validation schemas for that domain
  - `components/` — UI components specific to that domain
- **`src/app/`** — Route definitions only. Pages compose components from `features/` and `core/`. No business logic in route files.

### Adding a New shadcn/ui Component

```bash
npx shadcn@latest add button
```

Components are output to `src/core/ui/` by default (configured in `components.json`). **Never manually edit files in `src/core/ui/`** — always use the CLI.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/hmbms_local?schema=public` |

Create a `.env` file in the project root. This file is gitignored — never commit it.

---

## License

Private — Internal use only.

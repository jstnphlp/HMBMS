# Human Milk Bank Management System (HMBMS)

A web-based management system for Makati Milk Bank to digitize operations across three milk collection programs: **Supsup Todo**, **Milky Way**, and **Mom's Act**.

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Database:** PostgreSQL (via Supabase Postgres Docker image)
- **ORM:** Prisma
- **UI Components:** shadcn/ui (New York style)
- **Styling:** Tailwind CSS v4
- **Containerization:** Docker

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop
- npm

### 1. Start the Local Database

```bash
docker compose up -d
```

This spins up a PostgreSQL instance on `localhost:5432` with database `hmbms_local`.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Database Migrations

```bash
npx prisma db push
```

To regenerate the Prisma client after schema changes:

```bash
npx prisma generate
```

### 4. Start the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Useful Prisma Commands

| Command | Description |
|---|---|
| `npx prisma studio` | Open Prisma Studio (visual DB browser) |
| `npx prisma format` | Format the schema file |
| `npx prisma generate` | Regenerate the Prisma client |
| `npx prisma db push` | Push schema changes to the database |
| `npx prisma migrate dev` | Create a named migration |

## Project Structure (Feature-Sliced Design)

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth-related pages (login, register)
│   ├── dashboard/              # Dashboard pages
│   ├── api/                    # API routes
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles + shadcn theme
├── core/                       # Shared, non-domain code
│   ├── db/
│   │   └── index.ts            # Prisma client singleton
│   ├── ui/                     # Raw shadcn/ui components (auto-generated)
│   └── utils/
│       └── cn.ts               # clsx + tailwind-merge utility
└── features/                   # Domain feature modules
    ├── donors/
    │   ├── actions.ts          # Server actions for donor operations
    │   ├── queries.ts          # Database queries for donors
    │   └── components/         # Donor-specific UI components
    ├── collections/
    │   ├── actions.ts
    │   ├── queries.ts
    │   └── components/
    ├── laboratory/
    │   ├── actions.ts
    │   ├── queries.ts
    │   └── components/
    ├── inventory/
    │   ├── actions.ts
    │   ├── queries.ts
    │   └── components/
    ├── dispensing/
    │   ├── actions.ts
    │   ├── queries.ts
    │   └── components/
    ├── disposal/
    │   ├── actions.ts
    │   ├── queries.ts
    │   └── components/
    ├── sms/
    │   ├── actions.ts
    │   ├── queries.ts
    │   └── components/
    └── audit/
        ├── actions.ts
        ├── queries.ts
        └── components/
```

### How FSD Works Here

- **`src/core/`** — Shared infrastructure (database client, UI primitives, utilities). Never import from `features/` here.
- **`src/features/<domain>/`** — Each feature is an isolated domain slice containing:
  - `actions.ts` — Server actions (mutations) for that domain
  - `queries.ts` — Read-only database queries for that domain
  - `components/` — UI components specific to that domain
- **`src/app/`** — Route definitions only. Pages compose components from `features/` and `core/`.

### Adding a New shadcn/ui Component

```bash
npx shadcn@latest add button
```

Components are output to `src/core/ui/` by default (configured in `components.json`).

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/hmbms_local?schema=public` |

## License

Private — Internal use only.

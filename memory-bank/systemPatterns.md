# System Patterns

> Persistent architectural rules for the HMBMS codebase.  
> All agents must read this file before making any changes.

---

## 1. Feature-Sliced Design (FSD)

### Directory Layout

```
src/
├── app/          # Route wrappers only — zero business logic
├── core/         # Shared infrastructure (cross-domain)
│   ├── db/       # Prisma client singleton (NEVER edit)
│   ├── ui/       # shadcn primitives (CLI-managed, NEVER manually edit)
│   └── utils/    # Shared utilities (cn.ts, supabase/, etc.)
└── features/     # Domain slices (isolated, parallel-safe)
    ├── donors/
    ├── collections/
    ├── laboratory/
    ├── inventory/
    ├── dispensing/
    ├── disposal/
    ├── sms/
    └── audit/
```

### Boundary Rules

- `src/app/` — Thin route wrappers only. May import from features and pass props. May NOT contain `db.` calls, Zod schemas, or `useState`/`useEffect` for domain state.
- `src/core/ui/` — Read-only shadcn primitives. Only modified via `npx shadcn@latest add`. Never manually edited.
- `src/core/db/index.ts` — Frozen Prisma singleton. Never edit.
- `src/features/[domain]/` — All implementation lives here: actions, queries, components, schemas.

### Import Rules

| From | To | Allowed |
|---|---|---|
| Feature | Core | YES — `import { db } from "@/core/db"` |
| Feature | Feature | NO — use shared types from `src/core/utils/` |
| App | Feature | YES — `import { X } from "@/features/x/components/y"` |
| Core | Feature | NO |

### Feature Slice Anatomy

```
src/features/[domain]/
├── actions.ts      # Server actions (mutations) — "use server"
├── queries.ts      # Read-only DB queries — "use server"
├── schemas.ts      # Zod validation schemas
└── components/     # Domain-specific UI components
```

---

## 2. shadcn/ui Core Primitive Usage

### Installation

```bash
npx shadcn@latest add [component]
```

Components are auto-placed in `src/core/ui/` per `components.json` configuration.

### Composition Pattern

Domain components import primitives and compose them:

```tsx
import { Button } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { cn } from "@/core/utils/cn";
```

### Design Tokens

All styling uses Tailwind CSS variables defined in `tailwind.config.ts` and `globals.css`.

**Forbidden:** Hex codes, arbitrary utilities (`bg-[#...]`), inline styles, raw RGB/HSL.

**Allowed tokens:** `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1`–`chart-5`, `sidebar-*`.

---

## 3. Prisma Single-Client Instantiation

### Location

`src/core/db/index.ts` — the only place `PrismaClient` is instantiated.

### Usage

```ts
import { db } from "@/core/db";
```

### Connection

Uses `@prisma/adapter-pg` with `PrismaPg` driver adapter. Connection string from `DATABASE_URL` in `.env`. Client cached on `globalThis` in dev to prevent exhaustion.

### Schema-First Workflow

1. Edit `prisma/schema.prisma`
2. `npx prisma format`
3. `npx prisma generate`
4. `npx prisma migrate dev --name <descriptive_name>`

> **⚠️ Never use `npx prisma db push`.** It modifies the database without creating migration files, causing drift that breaks `prisma migrate dev`.

### Transaction Requirement

Multi-step writes affecting medical tracking state MUST use `$transaction`:

- Batch pooling (volume summation)
- Pasteurization + lab result recording
- Inventory deduction during dispensing
- Batch disposal (status + inventory + disposal record)
- Collection → Batch assignment

---

## 4. Zod Validation Mandate

Every server action and API endpoint must validate input through Zod before any database operation.

```ts
const parsed = schema.safeParse(rawInput);
if (!parsed.success) {
  return { success: false, errors: parsed.error.flatten().fieldErrors };
}
```

Schemas live in `src/features/[domain]/schemas.ts`.

---

## 5. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Component files | kebab-case.tsx | `donor-table.tsx` |
| Component exports | PascalCase | `DonorTable` |
| Utility files | camelCase.ts | `cn.ts` |
| Server actions | camelCase functions | `createDonor()` |
| Schema exports | camelCase + Schema suffix | `createDonorSchema` |
| Type exports | PascalCase + Input suffix | `CreateDonorInput` |

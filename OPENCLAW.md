# OPENCLAW.md — Agent Runtime Instructions for OpenClaw

> **Runtime:** OpenClaw + Playwright CLI
> **Model:** Xiaomi MiMo 2.5 Pro (`xiaomi/mimo-v2.5-pro`)
> **Project:** HMBMS — Human Milk Bank Management System
> **Full architecture rules:** See `AGENTS.md` (non-negotiable, read it first)
> **Design system rules:** See `DESIGN.md`

---

## 1. Project Context

HMBMS is a Next.js 16 web application for Makati Milk Bank that digitizes three milk collection programs: **Supsup Todo**, **Milky Way**, and **Mom's Act**. It is a medical-grade system — data integrity and UI correctness are not optional.

**Stack at a glance:**

- Framework: Next.js 16 (App Router, Turbopack, React 19)
- ORM: Prisma 7.8 with `@prisma/adapter-pg`
- Database: PostgreSQL via Docker (`localhost:5432`) or Supabase CLI (`localhost:54322`)
- UI: shadcn/ui New York style, Tailwind CSS v4, CSS variables
- Architecture: Feature-Sliced Design (FSD)
- Language: TypeScript strict mode

**Dev server:** `http://localhost:3000`
Start it with `npm run dev` before running any Playwright tests.

---

## 2. OpenClaw + Playwright Setup

### Prerequisites

```bash
npm install -g openclaw
npx playbooks add skill openclaw/skills --skill playwright-cli
```

### MiMo Provider Config

```json
{
  "env": { "XIAOMI_API_KEY": "your-key" },
  "agents": {
    "defaults": {
      "model": {
        "primary": "xiaomi/mimo-v2.5-pro"
      }
    }
  },
  "models": {
    "mode": "merge",
    "providers": {
      "xiaomi": {
        "baseUrl": "https://api.xiaomimimo.com/v1",
        "api": "openai-completions",
        "apiKey": "XIAOMI_API_KEY",
        "models": [
          {
            "id": "mimo-v2.5-pro",
            "name": "MiMo V2.5 Pro",
            "reasoning": true,
            "input": ["text"],
            "contextWindow": 1048576,
            "maxTokens": 32000
          }
        ]
      }
    }
  }
}
```

---

## 3. Test + Fix Workflow (Core Loop)

This is the primary loop. Execute it for every test run.

```
1. Confirm dev server is running at http://localhost:3000
2. Use playwright-cli to navigate to the target route
3. Run playwright-cli snapshot — capture DOM structure
4. Check for: broken layouts, missing data, console errors, failed server actions
5. If a bug is found:
   a. Locate the source file in src/features/[domain]/ or src/app/[route]/
   b. Read the file before editing
   c. Apply the fix
   d. Run the verification pipeline (see Section 5)
6. If no bugs found, report the route as passing
```

**Never fix an issue by suppressing it.** No `@ts-ignore`, no `eslint-disable`, no `as any` on database payloads, no hardcoded hex colors to bypass the token system.

---

## 4. Routes to Test

Test these routes in order. Each route maps to an FSD feature domain.

| Route | Domain | Key Things to Check |
|---|---|---|
| `http://localhost:3000/` | — | Landing/login page renders, no hydration errors |
| `http://localhost:3000/(auth)/login` | — | Form renders, inputs focusable, submit triggers server action |
| `http://localhost:3000/dashboard` | — | Dashboard layout renders, sidebar present |
| `http://localhost:3000/dashboard/donors` | `features/donors` | Donor table renders, data loads, create form works |
| `http://localhost:3000/dashboard/collections` | `features/collections` | Collection list, program filter (Supsup Todo / Milky Way / Mom's Act) |
| `http://localhost:3000/dashboard/laboratory` | `features/laboratory` | Lab results table, pre/post pasteurization stages |
| `http://localhost:3000/dashboard/inventory` | `features/inventory` | Inventory levels display correctly, no negative volumes |
| `http://localhost:3000/dashboard/dispensing` | `features/dispensing` | Dispensing form, volume validation enforced |
| `http://localhost:3000/dashboard/disposal` | `features/disposal` | Disposal records, batch status reflects DISPOSED |

### Playwright CLI Quick Commands

```bash
# Navigate to a route
playwright-cli open http://localhost:3000/dashboard/donors

# Snapshot the DOM (use this to inspect structure)
playwright-cli snapshot

# Take a screenshot
playwright-cli screenshot donors-table.png

# Click an element by reference from snapshot
playwright-cli click e12

# Check browser console for errors
playwright-cli console
```

---

## 5. Verification Pipeline (Run After Every Fix)

All steps must pass before a fix is considered complete. Run them in sequence.

```bash
# Step 1 — TypeScript
npm run typecheck

# Step 2 — Prisma schema integrity
npx prisma validate

# Step 3 — Regenerate Prisma client (only if schema changed)
npx prisma generate

# Step 4 — Format schema (only if schema changed)
npx prisma format

# Step 5 — Lint
npm run lint

# Step 6 — Production build (final gate)
npm run build
```

If any step fails: read the error, fix the root cause, re-run from that step, then re-run all subsequent steps. Do not report completion until all six pass.

---

## 6. File Editing Boundaries

Read this before touching any file.

### You MAY edit:

- `src/features/[domain]/actions.ts` — server actions (mutations)
- `src/features/[domain]/queries.ts` — read-only DB queries
- `src/features/[domain]/schemas.ts` — Zod validation schemas
- `src/features/[domain]/components/` — domain UI components
- `src/app/[route]/page.tsx` — route wrapper only (no business logic)
- `prisma/schema.prisma` — only if the fix explicitly requires a schema change

### You MUST NOT edit:

- `src/core/ui/` — shadcn primitives, CLI-managed, read-only
- `src/core/db/index.ts` — Prisma singleton, frozen
- `src/app/globals.css` — design tokens, frozen
- `tailwind.config.ts` — frozen
- `tsconfig.json` — frozen
- `next.config.ts` — frozen unless the task explicitly requires it
- `docker-compose.yml` — frozen
- `.env` — never read, never write, never log its contents

### Cross-feature imports are forbidden:

Features must not import from each other. Shared utilities go in `src/core/utils/` only.

---

## 7. Common Bug Patterns & Where to Look

| Symptom | Likely Location | What to Check |
|---|---|---|
| Table not rendering data | `features/[domain]/queries.ts` | Missing `include`, wrong `where`, unhandled null |
| Form submission silently fails | `features/[domain]/actions.ts` | Zod parse failure not returned, missing `revalidatePath` |
| Type error on Prisma result | `features/[domain]/components/` | Schema mismatch, stale generated client |
| Broken layout / wrong colors | `features/[domain]/components/` | Hardcoded hex or arbitrary Tailwind value — replace with semantic token |
| 500 on server action | `features/[domain]/actions.ts` | Missing `"use server"` directive, db call outside transaction where required |
| Negative inventory volume | `features/dispensing/actions.ts` | Volume check before `$transaction` is missing or wrong |
| Enum value mismatch | `prisma/schema.prisma` | Enum value in code doesn't match schema — regenerate client |

---

## 8. Design Rules (Enforced During Fix)

When fixing UI components, apply these rules from `DESIGN.md`. Violations must be corrected, not preserved.

**Colors — semantic tokens only:**
- Use `bg-background`, `text-foreground`, `bg-primary`, `text-destructive`, etc.
- Never use hex codes (`#ffffff`), arbitrary values (`bg-[#1a1a1a]`), or inline `style={{ color: "..." }}`

**Admin interface (dashboard routes) — Clinical Precision style:**
- Compact 40px table row heights
- Alternating Slate 50 row stripes
- Soft 0.25rem border radius
- No shadows except dropdowns/popovers
- 14px body, 12px labels, Inter font

**Public interface (landing/auth routes) — Soft Modern style:**
- Generous whitespace, max-width 1280px container
- 0.5rem rounded cards, pill buttons for CTAs
- Soft blue-tinted ambient shadows
- 18px body copy

**Status chips:**
- Use Badge component from `src/core/ui/badge.tsx`
- Admin: small, high-contrast text
- Public: soft pastel backgrounds

---

## 9. Database & Transaction Rules

**All DB access goes through the singleton:**
```ts
import { db } from "@/core/db";
```

**These operations require `$transaction`** — if any of them are implemented without it, that is a bug to fix:

- Assigning collections to a batch (volume summation must be atomic)
- Pasteurization status update + lab result recording (must stay in sync)
- Inventory deduction during dispensing (available_vol decrement must be atomic)
- Batch disposal (`Batch.status` → `DISPOSED`, `Inventory.available_vol` → 0, `Disposal` record — all atomic)

**`revalidatePath` is required** after every mutation so the UI reflects the change. Missing `revalidatePath` is a bug.

---

## 10. Execution Rules

These mirror `AGENTS.md` Section 2 and apply to this agent as well:

- **No conversational filler.** Do not narrate plans or output "I will now...". Just act.
- **One-shot completion.** Output complete files. No truncated code, no `// ... existing code ...` unless doing a surgical diff on a large file.
- **Infer missing details.** If a route exists but a component is missing, read `prisma/schema.prisma` and build it.
- **Assume FSD defaults.** Ambiguous UI? Default to shadcn/ui New York + `DESIGN.md` admin style for dashboard routes, soft modern for public routes.
- **Verify before reporting done.** All six verification steps must pass.

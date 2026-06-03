# Active Context

> Template for tracking the current worktree's state.  
> Each agent worktree should maintain its own copy of this file.

---

## Current Assignment

| Field | Value |
|---|---|
| **FSD Domain** | `inventory` |
| **Custom Mode** | `feature-ui-builder` |
| **Branch** | `feature/inventory-ui` |
| **Worktree Path** | `../agent-workspaces/feature-inventory-ui` |
| **Execution Method** | Kilo Code CLI (feature-ui-builder mode) |

---

## Local Supabase Configuration

| Field | Value |
|---|---|
| **API URL** | `http://localhost:14321` |
| **DB Port** | `14322` |
| **Studio URL** | `http://localhost:14323` |
| **Anon Key** | Check `.env` for `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Ports remapped to 1432x to avoid collision with other worktrees.

---

## Implementation State

### Completed

- [ ] Schema changes (`prisma/schema.prisma`)
- [ ] Zod schemas (`src/features/[domain]/schemas.ts`)
- [ ] Server actions (`src/features/[domain]/actions.ts`)
- [ ] Read queries (`src/features/[domain]/queries.ts`)
- [ ] UI components (`src/features/[domain]/components/`)
- [ ] Route wrapper (`src/app/dashboard/[domain]/page.tsx`)

### Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npx prisma validate` — valid datamodel
- [ ] `npx prisma format` — formatted
- [ ] `npx prisma generate` — client generated
- [ ] `npm run lint` — zero warnings
- [ ] `npm run build` — successful compilation

---

## Notes

**Current Task:** Build the unified Inventory UI by querying the Stitch MCP server for both the "Disposal Management" and "Milk Collection Management" designs, combining them into a single comprehensive ledger.

The agent MUST always explicitly refer to and enforce the rules within AGENTS.md and DESIGN.md.

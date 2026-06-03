# Active Context

> Template for tracking the current worktree's state.  
> Each agent worktree should maintain its own copy of this file.

---

## Current Assignment

| Field | Value |
|---|---|
| **FSD Domain** | `analytics` |
| **Custom Mode** | `feature-ui-builder` |
| **Branch** | `feature/reports-analytics` |
| **Worktree Path** | `../agent-workspaces/feature-reports-analytics` |
| **Execution Method** | Kilo Code CLI (feature-ui-builder mode) |

---

## Local Supabase Configuration

| Field | Value |
|---|---|
| **API URL** | `http://localhost:64321` |
| **DB Port** | `64322` |
| **Studio URL** | `http://localhost:64323` |
| **Anon Key** | Check `.env` for `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Ports remapped to 6432x to avoid collision with other worktrees.

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

**Current Task:** Build the Reports & Analytics UI by dynamically querying the Stitch MCP server to determine the exact design layout, chart styles, and component structure, enforcing a light theme and removing all grayscale colors.

The agent MUST always explicitly refer to and enforce the rules within AGENTS.md and DESIGN.md.

# Active Context

> Template for tracking the current worktree's state.  
> Each agent worktree should maintain its own copy of this file.

---

## Current Assignment

| Field | Value |
|---|---|
| **FSD Domain** | `donors` |
| **Custom Mode** | `feature-ui-builder` |
| **Branch** | `feature/donor-history-ui` |
| **Worktree Path** | `../agent-workspaces/feature-donor-history-ui` |
| **Execution Method** | Kilo Code CLI (feature-ui-builder mode) |

---

## Local Supabase Configuration

| Field | Value |
|---|---|
| **API URL** | `http://localhost:54421` |
| **DB Port** | `54422` |
| **Studio URL** | `http://localhost:54423` |
| **Anon Key** | Check `.env` for `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Ports remapped to 5442x to avoid collision with other worktrees.

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

**Current Task:** Build the Donor Management History UI by dynamically querying the Stitch MCP server to determine the exact design layout, enforcing a light theme and removing all grayscale colors.

**Stitch Project:** `Makati Milk Bank System` — use `list_projects` to find it, then query screens and design tokens from that project.

The agent MUST always explicitly refer to and enforce the rules within AGENTS.md and DESIGN.md.

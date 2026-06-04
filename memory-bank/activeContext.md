# Active Context

> Tracking state for the `feature/recipient-ui` worktree.

---

## Current Assignment

| Field | Value |
|---|---|
| **FSD Domain** | `recipients` |
| **Custom Mode** | `feature-ui-builder` |
| **Branch** | `feature/recipient-ui` |
| **Worktree Path** | `../agent-workspaces/feature-recipient-ui` |
| **Execution Method** | Kilo Code CLI (feature-ui-builder mode) |

---

## Local Supabase Configuration

| Field | Value |
|---|---|
| **API URL** | `http://127.0.0.1:64321` |
| **DB Port** | `64322` |
| **Studio URL** | `http://127.0.0.1:64323` |
| **Anon Key** | Check `.env` for `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Ports remapped to 6432x to avoid collision with primary workspace.

---

## Implementation State

### Completed

- [ ] Schema changes (`prisma/schema.prisma`) — expand `Beneficiary` model if needed
- [ ] Zod schemas (`src/features/recipients/schemas.ts`)
- [ ] Server actions (`src/features/recipients/actions.ts`)
- [ ] Read queries (`src/features/recipients/queries.ts`)
- [ ] UI components (`src/features/recipients/components/`)
- [ ] Route wrapper (`src/app/dashboard/recipients/page.tsx`)

### Verification Checklist

- [ ] `npm run typecheck` — zero errors
- [ ] `npx prisma validate` — valid datamodel
- [ ] `npx prisma format` — formatted
- [ ] `npx prisma generate` — client generated
- [ ] `npm run lint` — zero warnings
- [ ] `npm run build` — successful compilation

---

## Notes

**Current Task:** Build the Recipient / Beneficiary Management UI by dynamically querying the Makati Milk Bank System project on the Stitch MCP server for exact design tokens, enforcing a light theme, and removing all grayscale colors.

**Stitch Project:** `Makati Milk Bank System` — use `list_projects` to find it, then query screens and design tokens from that project.

The agent MUST always explicitly refer to and enforce the rules within AGENTS.md and DESIGN.md.

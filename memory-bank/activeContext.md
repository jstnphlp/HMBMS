# Active Context

> Template for tracking the current worktree's state.  
> Each agent worktree should maintain its own copy of this file.

---

## Current Assignment

| Field | Value |
|---|---|
| **FSD Domain** | `[donors \| collections \| laboratory \| inventory \| dispensing \| disposal \| sms \| audit]` |
| **Custom Mode** | `[feature-ui-builder \| prisma-db-engine \| domain-tester]` |
| **Branch** | `feature/[domain-name]` |
| **Worktree Path** | `../agent-workspaces/feature-[name]` |

---

## Local Supabase Configuration

| Field | Value |
|---|---|
| **API URL** | `http://localhost:54321` |
| **DB Port** | `5432` |
| **Studio URL** | `http://localhost:54323` |
| **Anon Key** | Check `.env` for `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Docker Container** | `hmbms-db` (supabase/postgres:15.1.0.117) |

### Dynamic Port Binding (Parallel Worktrees)

When running multiple worktrees simultaneously, each worktree needs its own database instance. Derive the port from the worktree path:

```powershell
# Extract a numeric suffix from the worktree path for port offset
$port = 5432 + [int](Get-Hash -String (Get-Location).Path -Algorithm MD5).Substring(0,4)
```

Or use a simpler convention:

| Worktree | DB Port | Supabase API Port |
|---|---|---|
| `feature-donors` | 5432 | 54321 |
| `feature-collections` | 5433 | 54322 |
| `feature-inventory` | 5434 | 54323 |

Update `.env` in each worktree:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:{PORT}/hmbms_local?schema=public"
```

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

<!-- Agent-specific notes go here -->

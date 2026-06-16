# Repository Guidelines

## Project Structure & Module Organization

HMBMS is a Next.js 16 App Router project using TypeScript, Prisma, Tailwind CSS v4, and shadcn/ui. Route wrappers live in `src/app/`; keep them thin and delegate domain behavior to `src/features/`. Shared infrastructure belongs in `src/core/`, including `db`, generated UI primitives, and reusable utilities. Prisma files live under `prisma/`. Static assets are in `public/`; generated Prisma output is under `src/generated/`.

Feature slices follow paths such as `src/features/donors`, `src/features/inventory`, and `src/features/dispensing`. Prefer local files named `queries.ts`, `actions.ts`, `schemas.ts`, and `components/*.tsx`.

## Build, Test, and Development Commands

- `npm run dev`: start the local Next.js development server.
- `npm run build`: generate Prisma Client, then build the production app.
- `npm run start`: run the built production server.
- `npm run lint`: run ESLint with the Next.js configuration.
- `npm run typecheck`: run `tsc --noEmit`.
- `npx prisma validate`: validate `prisma/schema.prisma`.
- `npx prisma format`: format the Prisma schema.
- `npx prisma generate`: regenerate Prisma Client after schema changes.

## Coding Style & Naming Conventions

Use strict TypeScript and React Server Components where appropriate. Components are PascalCase exports in kebab-case files, for example `donor-table.tsx` exporting `DonorTable`. Start feature `actions.ts` and `queries.ts` with `"use server";`.

Import shared code through aliases such as `@/core/db`, `@/core/ui/button`, and `@/core/utils/cn`. Use semantic Tailwind tokens; avoid hardcoded colors, inline styles, and arbitrary utilities. Do not manually edit `src/core/ui`; add primitives through the shadcn CLI.

## Testing Guidelines

There is no dedicated test script currently. Validate changes with `npm run typecheck`, `npm run lint`, `npx prisma validate`, and `npm run build`. For route smoke checks, use `node test-routes.mjs`. Place future tests near the feature they cover, using names such as `donor-form.spec.ts`.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit prefixes such as `feat:` and `chore:`. Keep commit subjects imperative and scoped to the change, for example `feat: add donor intake form`.

Pull requests should include a summary, validation commands run, linked issue or task, screenshots for UI changes, and notes for schema or migration changes. Never include `.env` secrets.

## Security & Data Guidelines

All persistence must go through Prisma via `db` from `src/core/db`. Validate server action and API inputs with Zod before database access. Hash passwords, enforce authorization in actions, and use Prisma transactions for multi-step medical inventory operations.

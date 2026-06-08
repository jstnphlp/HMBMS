# Security TODOs

These vulnerabilities were identified during the production audit. They are transitive
dependencies that cannot be fixed without breaking changes. Review before deploying.

## @hono/node-server < 1.19.13
- **Issue:** Middleware bypass via repeated slashes (GHSA-92pp-h63x-v22m)
- **Source:** Transitive via prisma → @prisma/dev → @hono/node-server
- **Action:** Monitor for a non-breaking Prisma update that resolves this

## postcss < 8.5.10
- **Issue:** XSS via unescaped `</style>` (GHSA-qx2v-qp2m-jg93)
- **Source:** Transitive via next → postcss
- **Action:** Monitor for a Next.js update that bumps postcss to 8.5.10+

# Coworking Pass — Backend API

Next.js Route Handlers (`app/api/**`) on Node.js, backed by PostgreSQL through Prisma. Runs on port **3001**.

```bash
npm install
cp .env.example .env     # set DATABASE_URL and JWT_SECRET
npx prisma generate
npx prisma db push       # or apply prisma/migrations
npm run dev              # http://localhost:3001, API docs at /api-doc
```

Useful scripts: `npm run build` (generates the Prisma client and builds), `npm run lint`, `npm run typecheck`, `npm test` (Vitest), `npm run test:api` (the API suites in `tests/api-qa/`), `npm run seed:accounts`, `npm run db:studio`.

- Schema: `prisma/schema.prisma` and `prisma/migrations/`
- Shared logic: `lib/`, grouped by domain: `auth/` (tokens, one-time codes, password policy, super admin), `booking/` (capacity, lifecycle, rescheduling), `company/` (fund allocation, join requests, team), `workspaces/` (space types, operating hours, visibility), `db/` (schema sync, seed data, cascading deletes), plus `prisma.ts`, `mailer.ts`, `wallet.ts`, `ownership.ts`
- The schema sync in `instrumentation.ts` runs at startup and adds missing columns idempotently.

See the [root README](../README.md) for the full project overview and the [documentation](../docs/).

# API integration QA suites

Black-box tests that hit a **local** backend (`npm run dev`, port 3001) and its **local** Postgres.
They create throw-away users directly in the database and use the dev-only master login code, so
never point them at a shared or production environment.

```bash
npm i -D pg                      # once
node tests/api-qa/suite-security-wallet-slots.mjs
node tests/api-qa/suite-company-capacity-payments.mjs
```

Env: `QA_API_URL` (default `http://localhost:3001/api`), `QA_DATABASE_URL` (default local `coworking` DB).
Covers: IDOR/RBAC, wallet idempotency and overdraft races, hall/theater slot and operating-hour
boundaries, concurrent booking (no overbooking), refunds, corporate wallet ledger, payment validation.

Suites: `suite-security-wallet-slots`, `suite-company-capacity-payments`, `suite-past-sessions`,
`suite-roles` (provider onboarding/moderation, HR, loyalty points, admin portal) and
`suite-authz-mutations` (admin-only configuration, package/payment/waitlist ownership) and
`suite-partner-workspaces` (partner create/delete, zero-capacity workspaces) and
`suite-notifications` (read/unread/delete ownership, hourly booking notice) and
`suite-booking-lifecycle` (past bookings reported as completed, newest-first lists).
`suite-record-ownership` (a booking or payment is only readable/changeable by its customer, a super admin or the owning partner).
The suites sign in as the seeded super admin (`superadmin@cwp-test.local`, see `TEST_ACCOUNTS.md`); override with `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD`.
`suite-past-sessions` only runs its time-sensitive checks during Saudi daytime hours.
Run them against a freshly migrated local database (`prisma migrate deploy`).

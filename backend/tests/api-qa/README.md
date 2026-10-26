# API integration QA suites

Black-box tests that hit a **local** backend (`npm run dev`, port 3001) and its **local** Postgres.
They create throw-away users directly in the database and use the dev-only master login code (the backend must be
started with `ALLOW_MASTER_OTP=true`, as `.claude/launch.json` does), so never point them at a shared or production environment.

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
`suite-company-team` (HR adds/removes existing member accounts by email, members cannot remove themselves, nobody else can change the team).
`suite-team-bookings-reschedule` (bookings made for team members and their check-in, the locked booking PUT, validated rescheduling with price differences, amenity request routing, the customer side of support tickets).
`suite-allocation-otp` (HR admin allocates company money into employees' wallets: validation, equal split, chosen amounts, atomicity, idempotency, hidden from employees; random one-time codes with expiry, attempt limit and single use; password reset).
The suites sign in as the seeded super admin (`superadmin@cwp-test.local`, see `TEST_ACCOUNTS.md`); override with `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD`.
`suite-past-sessions` only runs its time-sensitive checks during Saudi daytime hours.
Run them against a freshly migrated local database (`prisma migrate deploy`).

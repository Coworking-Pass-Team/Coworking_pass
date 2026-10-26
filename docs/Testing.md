# Testing

How Coworking Pass is tested in Version 2.0, how to run each layer, and where the older QA reports are kept.

## 1. Test layers

| Layer | Location | Tool | What it covers |
| :--- | :--- | :--- | :--- |
| Unit | `backend/tests/*.test.ts` | Vitest | Pure server rules: room capacity, operating hours, one-time code generation and email configuration, password policy, super admin provisioning plan. |
| API integration | `backend/tests/api-qa/suite-*.mjs` (13 suites) | Node + `pg` | Black-box calls to the running API plus checks in the database: authorization and ownership, wallets and idempotency, capacity races, slots and operating hours, refunds, company team and join requests, fund allocation, team bookings and rescheduling, notifications, one-time codes, password reset and the password policy. |
| Browser | `frontend/tests/*.spec.ts` | Playwright | Public pages (smoke and responsive checks), the admin and member journeys, company employee screens, "My tickets", the reschedule dialog, HR fund allocation, the spaces page shell, the password-reset screens and the live password checklist, in Arabic and English. |

## 2. Running the tests

All integration and browser tests run against the **local** stack only: the backend on port 3001, the frontend on
port 3000, and a local PostgreSQL database (the team uses a Docker container). They create throwaway accounts and
write known one-time codes straight into that database, so never point them at Render, Neon or production.

```bash
# backend
npm test                                   # Vitest
npm run test:api                           # every API suite, one line per suite
node tests/api-qa/suite-roles.mjs          # one suite

# frontend
npm run test:e2e                           # Playwright (needs both apps running)
```

Environment variables:

| Variable | Default | Used by |
| :--- | :--- | :--- |
| `QA_API_URL` | `http://localhost:3001/api` | API suites |
| `QA_DATABASE_URL` | `postgresql://postgres:localdev@localhost:5432/coworking` | API suites and the Playwright helpers that plant codes |
| `QA_BASE_URL` | `http://localhost:3000` | Playwright specs |
| `TEAM_ACCOUNTS_FILE` | `backend/scripts/team-accounts.json`, then the example file | Seed script and tests |

Start the backend with an **empty** `RESEND_API_KEY` for test runs, so codes are printed in the console instead of
emailed to the team's real mailboxes.

## 3. One-time codes in tests

There is no shared test code. Real codes are random and emailed, so tests replace the stored code with one they know:

* `plantOtp(userId, purpose)` and `signIn(email, password)` in `backend/tests/api-qa/lib.mjs`.
* `backend/tests/api-qa/plant-otp.mjs <email> <purpose>` prints a planted code; the Playwright helper
  `frontend/tests/helpers/otp.ts` calls it and types the code into the six boxes.

## 4. Test data

* `npm run seed:accounts` creates one account per role with a little data (see [Accounts.md](Accounts.md)).
* The demo venues come from `GET /api/seed` (super admin only). Some suites need at least four visible venues with a
  desk area, so run it once on a fresh local database.
* Suites remove the workspaces and bookings they create, so repeated runs do not pile up data.

## 5. Known limits

* `suite-past-sessions` only runs its time-sensitive checks during Saudi daytime hours.
* `multi-device.spec.ts` takes screenshots of the public pages at four screen sizes; with `QA_BASE_URL` it can audit
  a deployed site, but it never signs in there.
* Screenshots and the HTML report are written to `testing/` (git-ignored).

## 6. Archived QA reports

The reports in [`testing/`](testing/) were written during the Version 1 audit. They are kept as a record and are
**not** updated: most defects they list have since been fixed (for example the hard-coded `123456` code, the logout
lockout and the missing workspace details endpoint).

| Report | Scope |
| :--- | :--- |
| [Phase 1: Database audit](testing/Phase1_Database_Audit.md) | Tables, enums, keys and indexes |
| [Phase 2: Backend API audit](testing/Phase2_Backend_API_Audit.md) | Routes, roles and business rules |
| [Phase 3: Frontend UI audit](testing/Phase3_Frontend_UI_Audit.md) | Screens and flows per portal |
| [Defects report](testing/Defects_Report.md) | Defects found and their fixes or limits |
| [Final platform report (Word)](testing/Final_Platform_Report.docx) | The compiled audit |

# Production checklist

The site currently runs as a **QA / testing deployment** on Render (frontend `coworking-pass-client`, backend
`coworking-pass-k49w`, database on Neon), deployed automatically from the `develop` branch. Everything below must be
done before the real public launch. Items marked **blocker** must not go live as they are today.

Repository note: this repository is **public**. Anything committed (including `TEST_ACCOUNTS.md`) can be read by anyone.

---

## 1. Test accounts and test data

- [ ] **blocker** Delete the QA test accounts from the production database (every `*@cwp-test.local` user from
      `TEST_ACCOUNTS.md`) together with their bookings, wallets, points, notifications, the company *Test Company Ltd*,
      the partners *Test Partner Venues* / *Test Pending Venues* and the workspace *Test Partner Hub*.
      Prefer the admin "delete user" action (it cascades) or write a reviewed SQL script; take a Neon backup first.
- [ ] Delete leftover manual-test accounts and workspaces (e.g. `aaaa`, `fff@gmail.com`, `QA Test Hub …`,
      `The Hub Sky Lounge Test`, venues named like `JKGF`, `sdcv`).
- [ ] Decide what to do with the 30 **standard demo venues** (The Hub Riyadh, WorkBay Jeddah, …). They are sample listings
      owned by a placeholder partner, not real venues: remove them or replace them with real partner venues.
- [ ] Never run `scripts/seed-test-accounts.mjs --allow-remote` against the production database again.
- [ ] Frontend fallback data (`frontend/data/data.ts`): the static venues shown when the API is unreachable are demo
      listings. Replace the fallback with an "unable to load venues, try again" state, and remove the unused demo users,
      bookings and support tickets.
- [ ] Remove the invented testimonials on the sign-in / sign-up side banners (names, roles and quotes in
      `frontend/app/Auth/page.tsx`), or replace them with real, approved customer quotes.
- [ ] Confirm the public contact details (support email, `+966 50 000 0000` phone, office hours) are real.

## 2. Sign-in, verification codes and email

- [ ] **blocker** The shared test code `123456` is accepted only when `ALLOW_MASTER_OTP=true`. Make sure the variable is **unset** on the production backend (it may stay on for the QA services). One-time codes are random, hashed, valid 10 minutes, single use and limited to 5 wrong guesses.
- [ ] **blocker** Configure real email delivery: verify the sending domain in Resend and set `RESEND_API_KEY` on Render.
      Test sign-up, sign-in and resend-code emails end to end (inbox and spam folder).
- [ ] **blocker** Implement password reset: there is no backend endpoint yet, and the frontend "Forgot password" only
      searches the browser's local user list. Needs a reset-code email, expiry and one-time use.
- [ ] Rate-limit sign-in, code verification and resend (per email and per IP) and lock after repeated failures.
- [ ] Set a long random `JWT_SECRET` (not the QA one) and decide on token lifetime (currently 24 hours).
- [ ] Make sure `DEV_SEED_ADMIN` is unset and `NODE_ENV=production`.
- [ ] Create the real super admin through `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` (strong password, real mailbox);
      remove `SUPER_ADMIN_RESET_PASSWORD` after first start.

## 3. Payments

- [ ] **blocker** Integrate a real payment gateway (e.g. **Moyasar** or **HyperPay**) for mada, Visa/Mastercard and
      Apple Pay, with server-side payment verification (gateway callback/webhook with signature check).
- [ ] **blocker** Until then the money flows are simulated:
      - `POST /api/wallet` lets a signed-in user credit their own wallet (`type: DEPOSIT`); top-ups must only be
        credited after a verified gateway payment.
      - `POST /api/payments` records payments reported by the browser; payments must be created by the server from the
        gateway result.
      - `POST /api/subscriptions` creates an ACTIVE pass without checking payment.
      - `/api/mock-payment` and `/api/payment-gateway/*` are simulations: remove or disable them in production.
- [ ] Compute loyalty points earned server-side (the browser currently sends the amount, within a limit).
- [ ] Remove the checkout text "256-bit SSL … SAMA compliant" until it is true for the chosen gateway.
- [ ] Invoices: VAT number, ZATCA (Fatoora) e-invoicing requirements, and refund policy wording reviewed.
- [ ] Partner payouts: define the real settlement process (bank transfer, schedule, reconciliation).

## 4. Security

- [ ] **blocker** Rotate every credential that was shared during QA (Neon database passwords, any key posted in chats).
- [ ] Restrict CORS on the backend (`backend/next.config.ts` currently allows `Access-Control-Allow-Origin: *`) to the
      production frontend domain.
- [ ] Disable or remove the maintenance routes in production: `/api/seed`, `/api/db-sync`, `/api/clean-tables`,
      `/api/clean-workspaces` (super-admin only today, but destructive).
- [ ] Decide whether the API documentation (`/api-doc`) should be public.
- [ ] Add security headers on the frontend (CSP, HSTS, X-Frame-Options) and run `npm audit` on both projects.
- [ ] Company team membership: employees can now ask to join (sign-up "Company employee" or the profile card) and the
      HR admin approves or declines the request (`/api/company-join-requests`). HR admins can still add an existing
      member account by email directly, without the employee's consent (the member is only notified). Decide whether
      direct add should become an invitation the employee accepts.
- [ ] Company team details: department and team role labels are kept only in the HR admin's browser, and passes are not
      allocated per employee on the server. Store both on the server before companies rely on them. (Team bookings are now
      linked to the named employees, and members cannot leave a company by themselves.)
- [ ] Company funds for employees: HR admins allocate money from the company wallet into employees' own wallets (equally or chosen amounts). Decide whether allocated money may be withdrawn or refunded to a bank like any other balance, and whether an HR admin needs a "take back" action when an employee leaves.
- [ ] Rescheduling: the price difference is computed from the new room's rate over the old room's (scaling what was paid).
      Replace it with the real price calculation once pricing moves to the server together with the payment gateway.

## 5. Database

- [ ] Separate databases for production and QA (use a Neon branch or project for QA; never test on production data).
- [ ] Enable Neon backups / point-in-time restore and test a restore.
- [ ] Schema changes currently reach Neon through the runtime schema sync (`backend/lib/db-schema-sync.ts`, run at server
      start). Move to `prisma migrate deploy` in the deploy step (baseline the existing database first).
- [ ] Personal data: privacy policy and terms reviewed for the Saudi Personal Data Protection Law (PDPL); data
      retention, account deletion and data export processes.

## 6. Hosting (Render)

- [ ] **blocker** The free plan sleeps after ~15 minutes without traffic; the first visitor then waits 30–60 seconds and
      sign-ins can fail meanwhile. Use paid instances for the frontend and the backend.
      (An UptimeRobot ping only helps partially: the free plan includes 750 instance hours per month for the whole
      account, and two services kept awake all month need about 1,490 hours.)
- [ ] Production services deploy from `main`; keep the QA services on `develop`.
- [ ] Custom domain with HTTPS; set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_URL` on the frontend service.
- [ ] Health check endpoint for the backend and uptime monitoring with alerts.
- [ ] Error tracking (e.g. Sentry) and log retention.

## 7. Content

- [ ] Real venue data, photos and bilingual (Arabic + English) names, descriptions, addresses and room names for every
      partner venue (rooms now have an Arabic name field).
- [ ] Ratings appear only when a venue has reviews; build the review system before showing ratings.
- [ ] Terms of service, privacy policy and cancellation policy reviewed by the business/legal owner.

## 8. Release

- [ ] All automated tests pass on `develop`:
      - `cd backend && npx vitest run`
      - API suites against a local database: `node tests/api-qa/<suite>.mjs` (see `backend/tests/api-qa/README.md`)
      - `cd frontend && npx playwright test tests/regression.spec.ts tests/space-types.spec.ts --project=chromium`
- [ ] `npx tsc --noEmit` and `npm run build` pass in both `frontend/` and `backend/`.
- [ ] Merge `develop` into `main` through a reviewed pull request, tag the release, then smoke-test the production site
      in Arabic and English (sign-up, sign-in, booking, payment, cancellation/refund, partner and admin screens).

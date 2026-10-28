# Production checklist

The site currently runs as a **QA / testing deployment** on **Vercel** (the frontend and the backend are two Vercel
projects; the database is on Neon), deployed automatically from GitHub. Everything below must be
done before the real public launch. Items marked **blocker** must not go live as they are today.

Repository note: this repository is **public**. Anything committed can be read by anyone. The team accounts' emails and password are kept in the git-ignored
`backend/scripts/team-accounts.json`; `docs/Accounts.md` lists only the roles.

---

## 1. Test accounts and test data

- [ ] **blocker** Delete the old public test accounts (every `*@cwp-test.local` user, whose password was published)
      from the Neon database together with their bookings, wallets, points and notifications, and the partner
      *Test Pending Venues*. Use the admin "delete user" action (it cascades); the old `superadmin@cwp-test.local` cannot
      be deleted that way and needs a reviewed SQL script. Take a Neon backup first.
- [ ] Decide whether the team accounts (`docs/Accounts.md`), the company *Test Company Ltd*, the partner
      *Test Partner Venues* and the workspace *Test Partner Hub* stay after launch.
- [ ] Delete leftover manual-test accounts and workspaces (e.g. `aaaa`, `fff@gmail.com`, `QA Test Hub …`,
      `The Hub Sky Lounge Test`, venues named like `JKGF`, `sdcv`).
- [ ] Decide what to do with the 30 **standard demo venues** (The Hub Riyadh, WorkBay Jeddah, …). They are sample listings
      owned by a placeholder partner, not real venues: remove them or replace them with real partner venues.
- [ ] Run `scripts/seed-accounts.mjs --allow-remote` against the production database only on purpose (it resets the team accounts' password and data).
- [ ] Frontend fallback data (`frontend/data/demo-data.ts`): the static venues shown when the API is unreachable are demo
      listings. Replace the fallback with an "unable to load venues, try again" state, and remove the unused demo users,
      bookings and support tickets.
- [ ] Remove the invented testimonials on the sign-in / sign-up side banners (names, roles and quotes in
      `frontend/app/Auth/page.tsx`), or replace them with real, approved customer quotes.
- [ ] Confirm the public contact details (support email, `+966 50 000 0000` phone, office hours) are real.

## 2. Sign-in, verification codes and email

- [x] The shared test code `123456` has been removed completely (no switch brings it back). One-time codes are random, hashed, valid 10 minutes, single use and limited to 5 wrong guesses, and are sent by email.
- [x] Password policy on sign-up and reset: at least 8 characters, a lowercase letter, an uppercase letter, a number and a special character, and no sequential characters (three letters or digits in a row going up or down, such as `123` or `abc`). Both screens show a live checklist and a confirm field.
- [ ] Do not carry `ALLOW_MASTER_OTP` over to Vercel (it no longer does anything).
- [ ] **blocker** Configure real email delivery: verify the sending domain in Resend, set `RESEND_API_KEY` and
      `RESEND_FROM_EMAIL` in the Vercel backend project. With the default sender `onboarding@resend.dev`, Resend delivers only to the Resend
      account owner's own address, so the other team members receive no sign-in codes until the domain is verified.
      Test sign-up, sign-in and resend-code emails end to end (inbox and spam folder).
- [x] Password reset by emailed code (`forgot-password`, `verify-reset-code`, `reset-password`), with expiry and one-time use.
- [x] Sign-in lockout: five wrong passwords within 15 minutes lock the email for the rest of the window. The counter is stored in the database (`LoginAttempt`), so it holds on every Vercel instance.
- [x] Sign-out ends only that device's token (stored as a SHA-256 hash in `RevokedToken` until it expires); a password reset or a suspension ends every session of the account (`User.sessionsRevokedAt`). After a suspension is lifted the person signs in again.
- [x] Emails (sign-up and sign-in codes, password reset, partner approval and rejection) are sent in the recipient's saved language, Arabic or English.
- [ ] Rate-limit code verification, code resend and sign-in per IP as well (Vercel firewall rules or a shared store such as Upstash Redis).
- [ ] Set a long random `JWT_SECRET` (not the QA one) and decide on token lifetime (currently 24 hours).
- [ ] Make sure `DEV_SEED_ADMIN` is unset and `NODE_ENV=production`.
- [ ] Create the real super admin through `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` (strong password, real mailbox);
      remove `SUPER_ADMIN_RESET_PASSWORD` after first start.

## 3. Payments

- [ ] **blocker** Integrate a real payment gateway (e.g. **Moyasar** or **HyperPay**) for mada, Visa/Mastercard and
      Apple Pay, with server-side payment verification (gateway callback/webhook with signature check).
      *Needs from the business:* a merchant agreement with the gateway (commercial registration or unified number, VAT
      certificate, bank account), Apple Pay merchant verification for the production domain, and the live API keys and
      webhook secret. These are set as backend environment variables on Vercel, never committed.
      *Then in code:* create payments on the server from the gateway result, credit wallet top-ups only after a verified
      callback, make refunds go back through the gateway, and remove the simulated routes listed below.
- [ ] **blocker** Until then the money flows are simulated:
      - `POST /api/wallet` lets a signed-in user credit their own wallet (`type: DEPOSIT`); top-ups must only be
        credited after a verified gateway payment.
      - `POST /api/payments` records payments reported by the browser; payments must be created by the server from the
        gateway result.
      - `POST /api/subscriptions` creates an ACTIVE pass without checking payment.
      - `/api/mock-payment` and `/api/payment-gateway/*` are simulations: remove or disable them in production.
- [ ] Compute loyalty points earned server-side (the browser currently sends the amount, within a limit).
- [ ] Remove the checkout text "256-bit SSL … SAMA compliant" until it is true for the chosen gateway.
- [ ] **blocker** Tax invoices: the platform issues no invoices yet. Before launch it needs ZATCA (Fatoora) e-invoicing
      Phase 2: VAT registration, onboarding the solution with ZATCA (compliance and production CSID certificates),
      simplified tax invoices for individuals and standard tax invoices for companies, each with the QR code and
      cryptographic stamp, and reporting or clearance through the ZATCA API (or an accredited e-invoicing provider).
      Until then the site promises no invoices: the pricing page says prices include 15% VAT and every payment is
      recorded in the wallet history; the "consolidated monthly VAT invoice", "ZATCA compliant" and "30-day net" claims
      were removed. Restore them only when invoicing is live.
- [ ] The "Corporate Invoice" checkout option (net 30) is simulated like the other payment methods: it needs real
      invoicing and credit terms in the company contract, or it should be hidden at launch.
- [ ] Refund policy wording reviewed.
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
- [x] Company funds for employees: money the HR admin allocates is kept apart in the member's wallet (`Wallet.companyCredit`). It is spent first on bookings, cannot be cashed out, can be capped per member per month by the HR admin (team page, "Company funds held by members"), returns as company money when a company-funded payment is refunded, and whatever is unspent goes back to the company wallet when the member is removed or their account is deleted (a `RECLAIM` row on both ledgers). A refund that arrives after the member left goes to the company wallet.
- [ ] Company funds allocated **before** this change were recorded as the member's own money and are not reclaimed on removal. If that matters for QA companies, review those wallets by hand.
- [ ] Company funds refunds: refunds through `POST /api/refund` and rescheduling are not linked to the original wallet charge, so they return company money first, up to the company-funded spending not yet refunded. Link each booking to its wallet charge when payments move to the server with the gateway.
- [ ] Rescheduling: the price difference is computed from the new room's rate over the old room's (scaling what was paid).
      Replace it with the real price calculation once pricing moves to the server together with the payment gateway.

## 5. Database

- [ ] Separate databases for production and QA (use a Neon branch or project for QA; never test on production data).
- [ ] Enable Neon backups / point-in-time restore and test a restore.
- [ ] Schema changes currently reach Neon through the runtime schema sync (`backend/lib/db/schema-sync.ts`, run at server
      start). Move to `prisma migrate deploy` in the deploy step (baseline the existing database first).
- [ ] Personal data: privacy policy and terms reviewed for the Saudi Personal Data Protection Law (PDPL); data
      retention, account deletion and data export processes.

## 6. Hosting (Vercel)

- [x] Signed-out tokens, ended sessions and the sign-in lockout are stored in PostgreSQL (`RevokedToken`,
      `User.sessionsRevokedAt`, `LoginAttempt`), so they hold on every serverless instance. The ban and session state is
      cached for at most 10 seconds per instance.
- [ ] Use Neon's pooled connection string (host containing `-pooler`) for `DATABASE_URL`, and check the function time
      limit for the heavier routes (`/api/seed`, reports).
- [ ] Choose a Vercel plan that allows commercial use (the Hobby plan is for personal, non-commercial projects).
- [ ] Production deploys from `main`; keep QA on a separate Vercel project or environment fed by `develop`, with its
      own Neon database.
- [x] The code fallbacks point to the Vercel QA addresses (`https://coworking-pass-sa.vercel.app`, `https://coworking-pass-backend.vercel.app`) instead of the old Render ones.
- [ ] Custom domain with HTTPS for production; set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_URL` on the frontend
      project and `NEXT_PUBLIC_SITE_URL` on the backend project, and point the code fallbacks
      (`frontend/services/api.ts`, `frontend/app/store.tsx`, `frontend/lib/spaces-server.ts`, `backend/lib/mailer.ts`)
      at the production domains.
- [ ] Uptime monitoring with alerts (add a health check endpoint to the backend).
- [ ] Error tracking (e.g. Sentry) and log retention (runtime logs are kept only briefly on the lower Vercel plans).

## 7. Content

- [ ] Real venue data, photos and bilingual (Arabic + English) names, descriptions, addresses and room names for every
      partner venue (rooms now have an Arabic name field).
- [ ] Ratings appear only when a venue has reviews; build the review system before showing ratings.
- [ ] Terms of service, privacy policy and cancellation policy reviewed by the business/legal owner.

## 8. Release

- [ ] All automated tests pass on `develop`:
      - `cd backend && npm test` (Vitest)
      - `cd backend && npm run test:api` (all 14 API suites against the local stack, see `docs/Testing.md`)
      - `cd frontend && npm run test:e2e` (Playwright against the local stack)
- [ ] `npx tsc --noEmit` and `npm run build` pass in both `frontend/` and `backend/`.
- [ ] Merge `develop` into `main` through a reviewed pull request, tag the release, then smoke-test the production site
      in Arabic and English (sign-up, sign-in, booking, payment, cancellation/refund, partner and admin screens).

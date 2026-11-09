# Security patch: Muttaka / Coworking Pass

The complete revised source files, migration and unit tests are included in `security-patch.zip`. Changes are also applied in this workspace. Existing unrelated working-tree changes were preserved; shared frontend files include the current workspace content.

## 1. Authentication and administrator credentials

- `backend/lib/auth/secrets.ts` rejects missing, short, placeholder and obviously repetitive JWT keys at module initialization. `verify-token.ts` and `sessions.ts` use the validated key; verification permits HS256 only.
- `backend/instrumentation.ts` imports the verifier before its best-effort schema-sync block, so invalid secrets abort startup instead of being swallowed.
- Super Admin provisioning and login enforce at least 12 characters, upper/lowercase letters, numbers and symbols, with a 72-byte maximum to avoid bcrypt truncation. Password reset applies this policy to Super Admin accounts too.
- Production rejects explicit development-admin provisioning and the demo-account seed script. Loyalty-rule seeding no longer creates a default administrator. Existing public legacy credentials are revoked by provisioning. The migration revokes existing administrator sessions and pending OTPs.
- `.env.example` contains an empty JWT key and a generation command, rather than a usable default. Keep the generated value outside source control.

## 2. Financial input and ledger constraints

- `financialBody()` examines JSON numeric tokens before parsing, because `JSON.parse` erases the difference between `100` and `1e2`. Strings are tokenized separately, so an invoice description containing `1e2` is harmless.
- Amounts must be JSON numbers, finite, and within **1.00–100,000.00 SAR** before rounding to cents. Negative numbers, zero, null, strings, NaN, infinity, malformed JSON and numeric exponent notation are rejected with HTTP 400.
- The shared validation covers booking/checkout mutations, mock payments, wallet mutations, payment updates, and company deposit/withdraw amounts.
- The SQL migration adds non-negative, finite amount checks to `Payment`, `WalletTransaction` and `CompanyWalletTransaction`. It intentionally fails on incompatible existing rows rather than silently rewriting financial history. Zero remains legal in the database for historical and non-cash entries; new monetary requests require at least SAR 1.

## 3. Pricing and transaction idempotency

- Direct booking prices use persisted section day/month/year rates, validated duration units and seats. Display text cannot extend the purchased duration.
- Hourly prices use the persisted section hourly rate and actual start/end interval, or the selected section's package price with matching duration. Requests cannot create fallback catalog records with invented rates.
- Subscription price and validity come from the persisted membership plan. `MembershipPlan.durationDays` defaults to 30; populate actual annual/day/custom plan durations before enabling checkout.
- Each booking/subscription, wallet debit, successful `WALLET` payment and idempotency response commit in one Prisma transaction. Insufficient balance rolls back the booking. Company debits use an atomic conditional decrement; personal debits retain the existing company-credit spending rules.
- `Idempotency-Key` is mandatory for POST to direct bookings, hourly bookings, subscriptions, payments, wallet and mock payment. Keys accept 16–128 letters, digits, underscores or hyphens. They are scoped to the authenticated caller and operation. PostgreSQL transaction advisory locks serialize matching requests. The response is persisted with the mutations; identical retries replay it, while a different payload using the same key returns 409.
- The frontend transport attaches keys and retains them after ambiguous failures during the current page session. External clients must retain the same key across retries, including process restarts. Records have no automatic expiry; do not remove them while clients can retry their associated operations.
- Public payment registration can only return an existing verified checkout settlement. Clients cannot declare payment success. Direct personal/company funding requires an administrator; ordinary self-service funding needs a real verified provider integration.
- Mock payment and mock gateway refund routes return 404 in production. Mock payment simulation does not create real payments or credit a ledger in development either.
- Purchased subscription fields cannot be overwritten through PUT. DELETE shares the authorized atomic refund path, and subscription refunds require an actual payment instead of falling back to the plan's current list price.

### Deliberate checkout restrictions

The former card and wallet-top-up flows were simulations or client assertions, not verified provider settlements. **This patch enables wallet-funded checkout only.** Card/invoice checkout and ordinary self-service wallet top-ups need a server-side provider integration with authenticated callbacks before being enabled.

Pass and loyalty discounts were calculated in the browser. Their checkout paths are blocked until equivalent server-side entitlement/redemption rules are implemented. They must not silently charge the full wallet price after showing a discount. The UI now refuses these paths and removes the old separate pre-debit calls. This is a security mitigation with a product impact, not a completed payment-provider implementation.

## 4. OTP cooldown and lockout

- OTP issuance and verification share a PostgreSQL advisory lock per account, across purposes and server instances.
- Resends require 60 seconds. Five consecutive wrong submissions invalidate all pending codes and lock issuance and verification for 15 minutes. Requesting a fresh code does not reset failed attempts. A correct consumed code cannot be reused.
- Lockout responses use HTTP 429, `Retry-After` and structured `retryAfter`/`code` fields. This is account-bound protection, independent of spoofable forwarded-IP headers; a separate trusted-edge IP limiter is not included.
- Production cannot log OTPs as a substitute for configured email delivery.
- The OTP screen keeps the 60-second resend countdown, consumes server throttle responses, displays remaining lockout time, and disables verification/resend while locked. A lockout deadline persists in session storage across reloads. The backend remains authoritative if browser state is cleared.

## Verification

Executed locally:

- Backend `npm test`: **109 tests passed across 13 files**, including 52 new security tests.
- Backend `npm run typecheck`: passed.
- Frontend `npm run typecheck`: passed.
- `git diff --check`: passed.
- Prisma client regenerated for the schema changes.

New test files cover secret/admin policy, malformed and exponent amount payloads, route-level price tampering, wallet settlement failure, idempotency replay/conflict/user scoping, production mock denial, concurrent OTP attempts/resends, cooldown and lockout expiry.

The unit tests use mocked database transactions. They exercise application behavior but do **not** establish real PostgreSQL concurrency or migration compatibility. The migration has **not** been applied to Neon, and browser end-to-end tests and a production build have **not** been run. There is no claim that unrelated platform routes have received a complete security audit.

## Deployment steps

1. Review the checkout restrictions above and populate real catalog rates and membership durations.
2. Set a newly generated JWT secret and strong Super Admin credentials in the deployment environment. Configure OTP email delivery.
3. In an isolated staging database, inspect existing negative/non-finite ledger amounts, apply `backend/prisma/migrations/20261108090000_security_hardening/migration.sql` using the repository's Prisma migration process, and regenerate the client. `prisma db push` alone does not install SQL check constraints.
4. Test simultaneous requests with the same key, conflicting payloads, insufficient balances, OTP lockout, cancellation/refunds, and the frontend wallet flow against PostgreSQL. Verify database check constraints reject negative, NaN and infinite amounts directly.
5. After staging validation, deploy the migration and matching backend/frontend together. Rotate/revoke credentials and sessions from any deployment that previously used a public JWT key. No deployment or production data mutation was performed by this patch.

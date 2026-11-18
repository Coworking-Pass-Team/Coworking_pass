# Defense evidence

The speaker supplied the title, institutional affiliation, engineering team, committee names, market framing and proposed roadmap. The review is presented as ready for committee assessment. The Saudi outline, occupancy bars, floor plan and city lights are illustrative.

| Page | Claim | Source and scope |
| --- | --- | --- |
| 1–3 | Saudi flexible-work concept, B2B2C roles and reservations | Speaker brief and [system requirements](../../docs/SRS.md). Vision 2030 is the speaker’s context. The map conveys geography. |
| 4 | Discovery, section and seat selection, direct bookings and memberships | [Booking flow](../../frontend/app/individual/BookingFlow.tsx), [selection hook](../../frontend/hooks/useBookingSelection.ts), [capacity checks](../../backend/lib/booking/capacity.ts), [subscriptions](../../backend/app/api/subscriptions/route.ts). |
| 5 | Prepaid wallet, transaction boundaries and retry protection | [Checkout](../../backend/lib/security/checkout.ts), [idempotency](../../backend/lib/security/idempotency.ts), [audit restrictions](../../SECURITY_PATCH.md). The audited checkout supports wallet funding at purchase. A verified gateway is a separate integration. |
| 6 | Points, configurable rules and promotional incentives | [Loyalty rules](../../backend/app/api/loyalty-rules/route.ts), [member view](../../frontend/app/loyalty/page.tsx), [product requirements](../../docs/SRS.md). The audit blocks browser-calculated discounts pending server-side redemption. |
| 7 | Partner capacity, pricing, reporting and settlement records | [Partner bookings](../../frontend/app/provider/SpaceBookings.tsx), [payout API](../../backend/app/api/payouts/route.ts), [data model](../../backend/prisma/schema.prisma). Bank transfer automation is outside the evidence for this scene. |
| 8 | Next.js App Router, TypeScript, Tailwind, Prisma, Neon PostgreSQL, Vercel target | [Project overview](../../README.md), [frontend dependencies](../../frontend/package.json), [backend dependencies](../../backend/package.json), [Prisma schema](../../backend/prisma/schema.prisma). The diagram traces a logical request. |
| 9 | Ten remediated findings | [Master remediation report](../../report_work/Security_Remediation_Report.docx) and [finding-to-fix evidence table](../../report_work/ten_findings.py). |
| 10 | 129/129, 15 files, 100% of executed tests and both type checks passed | [Final report table](../../report_work/plain_english_report.py) in [audit snapshot 19fb9e1](https://github.com/Coworking-Pass-Team/Coworking_pass/tree/19fb9e1). The final table marks production build, browser end-to-end and database staging validation pending. The older root patch summary describes an earlier test run. |
| 11 | Up to 35% partner revenue lift | Speaker-directed illustrative industry projection for workspace occupancy optimization in Saudi Arabia. No observed revenue series or independently sourced benchmark was supplied. |
| 12 | SQL constraints and credential rotation, followed by proposed mobile and AI work | [Migration](../../backend/prisma/migrations/20261108090000_security_hardening/migration.sql), [deployment steps](../../SECURITY_PATCH.md) and speaker roadmap. |
| 13 | Committee review and Q&A | Committee names and requested sign-off framing supplied by the speaker. |

## Audit index

| ID | Concern | Remediation described to the committee |
| --- | --- | --- |
| F-01 | JWT role forgery | Validate runtime signing policy and limit accepted algorithm. |
| F-02 | Unbacked deposits | Restrict direct funding authority. The report identifies inspection as evidence for this restriction. |
| F-03 | Fake payment and refund chain | Tie settlement to the booking transaction and require a paid wallet record for refund. |
| F-04 | Subscription catalog fallback | Refund only the owner’s actual successful payment. |
| F-05 | Negative amounts | Check monetary inputs before rounding. |
| F-06 | OTP rate limiting | Enforce account cooldown and lockout across requests. |
| F-07 | Subscription IDOR | Check stored ownership and protect purchased fields. |
| F-08 | Stored XSS in JSON-LD | Encode embedded data at the HTML output boundary. |
| F-09 | Partner data over-fetching | Publish an explicit set of public partner fields. |
| F-10 | Silent administrator creation | Public empty reads remain side-effect free. Provision administrators explicitly. |

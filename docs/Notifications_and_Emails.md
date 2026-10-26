# Notifications and Transactional Emails

**Project: Coworking Pass** · Audited against the code on branch `develop` (commit `f1c140c`, 2026-10-26); updated the same day for the company wallet, team bookings, rescheduling, My Tickets and amenity-routing changes.

This document is the single reference for every notification and email the platform can send: **who triggers it, who receives it, through which channel, and whether it works today.** It was written from the source code, not from the earlier plans, so where it differs from older documents this one is correct.

## 1. How notifications work

| Channel | What it is | Where it lives |
| :--- | :--- | :--- |
| **In-app** | A row in the `Notification` table, shown in the bell menu and on the notifications page of the recipient. Read/unread state is stored per row. | `backend/prisma/schema.prisma` (`Notification`), `GET/POST/PUT/DELETE /api/notifications` |
| **Email** | A message sent through the **Resend** API. Only four emails exist (section 4). | `backend/lib/mailer.ts` |

Important facts:

* The `channel` column (`IN_APP`, `EMAIL`, `BOTH`) is only a **label** stored with the row. It does not send anything. The only code that sends email is `lib/mailer.ts`, called directly from the routes listed below.
* Notifications are created in two ways:
  1. **By the server**, inside the API route that performs the action (section 2). These are reliable and are the main source.
  2. **By the browser** (section 3), which posts a message to `POST /api/notifications`. The server only accepts it when the caller targets their own account, the caller is a Super Admin, or the target is a partner account.
* Server-side notifications are *best effort*: a failure is logged and never undoes the booking, payment or approval that caused it.
* Notification titles and messages are written in English and translated to Arabic when displayed (`translateMessage()` in the frontend `i18n/messages-*.ts` registries). Every new notification text needs an Arabic entry there.
* Email text is **English only** today.

## 2. In-app notifications created by the server

| # | Trigger (what happens) | Sender (who/what causes it) | Recipient | Type | Channel | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| S1 | A new partner registers and is waiting for approval | The partner (sign-up with the partner role) | Every **Super Admin** | `PARTNER_APPROVED` (mislabelled, see section 6) | In-app | Working |
| S2 | A partner application is approved | **Super Admin** (`PUT /api/partners/{id}`, status `APPROVED`) | The partner's account (matched by contact email) | `PARTNER_APPROVED` | In-app **and** email (E3) | In-app working; email depends on Resend (section 5) |
| S3 | A direct (day / month / year) booking is created | The booking owner | The booking owner | `BOOKING_CONFIRMED` | In-app | Working |
| S4 | An hourly session (meeting room / theater) is booked | The booking owner | The booking owner | `MEETING_BOOKED` | In-app | Working |
| S5 | A direct booking is cancelled | The booking owner (`DELETE /api/direct-bookings/{id}`) | The booking owner | `BOOKING_CANCELLED` | In-app | Working |
| S6 | A cancelled direct booking frees a seat and the first person on the waitlist is promoted | The cancelling user (automatic) | The promoted waitlist user | `WAITLIST_PROMOTED` | In-app | Working (only on this cancel path) |
| S7 | A user joins the waitlist | The user | The same user | `WAITLIST_JOINED` | In-app | Working |
| S8 | A payment is recorded as successful (`POST /api/payments`) | The payer's browser | The payer | `PAYMENT_SUCCESS` | In-app | Working; the payment itself is simulated (no real gateway yet) |
| S9 | A booking is refunded to the wallet (`POST /api/refund`) | The booking owner or a Super Admin | The booking owner | `PAYMENT_SUCCESS` ("Amount Refunded") | In-app | Working |
| S10 | A pass (subscription) is refunded, either through `POST /api/refund` or by cancelling it (`DELETE /api/subscriptions/{id}`) | The pass owner or a Super Admin | The pass owner | `PAYMENT_SUCCESS` ("Subscription Refunded") | In-app | Working |
| S11 | A support ticket is created (including the enterprise category) | The customer | Every **Super Admin** | `SUPPORT_TICKET` | In-app | Working |
| S12 | A Super Admin replies to a ticket | **Super Admin** | The ticket owner | `SUPPORT_TICKET` | In-app | Working |
| S13 | An HR admin adds an existing member to the company team | **HR admin** (`POST /api/companies/{id}/employees`) | The added member | `PASS_ASSIGNED` | In-app | Working |
| S14 | An HR admin removes a member from the team | **HR admin** | The removed member | `PASS_ASSIGNED` | In-app | Working |
| S15 | The HR admin books a session or desk for named team members | **HR admin** (`POST /api/hourly-bookings`, `/api/direct-bookings` with `attendeeIds`) | Each named employee ("Booked for you by your company") | `BOOKING_CONFIRMED` | In-app | Working |
| S16 | An employee asks to join a company (sent once their email is verified, or right away for an existing member) | The employee | The company's **HR admin** | `PASS_ASSIGNED` | In-app | Working |
| S17 | The HR admin approves or declines a join request | **HR admin** (`PATCH /api/company-join-requests/{id}`) | The employee | `PASS_ASSIGNED` | In-app | Working |
| S18 | A booking is rescheduled (`POST .../reschedule`) | The booking owner or a Super Admin | The owner, the people the booking was made for and the venue's partner ("Booking Rescheduled") | `BOOKING_CONFIRMED` | In-app | Working (no email) |
| S19 | A customer replies on their own support ticket | The ticket owner | Every **Super Admin** ("New reply on a support ticket") | `SUPPORT_TICKET` | In-app | Working |
| S20 | A partner files a custom amenity request | The partner (`POST /api/amenities`) | Every **Super Admin** (not the partner) | `AMENITY_REQUEST_STATUS` | In-app | Working (was a defect, fixed: the server now routes it) |
| S21 | A Super Admin approves or rejects an amenity request | **Super Admin** (`PUT /api/amenities/{id}`) | The partner who asked | `AMENITY_REQUEST_STATUS` | In-app | Working |
| S22 | The HR admin allocates company funds to employees (`POST /api/companies/{id}/allocate`) | **HR admin** | Each employee who received money ("Funds added to your wallet") | `PAYMENT_SUCCESS` | In-app | Working |

The team notifications (S13, S14, S16, S17) use the type `PASS_ASSIGNED` because the notification type list has no team-specific value. They do not mean a pass was assigned. A member can no longer leave the team on their own, so there is no "member left" notification.

## 3. In-app notifications created by the browser

These are created in `frontend/app/store.tsx` (`addNotification`) and saved through `POST /api/notifications`. They are also kept in the browser's local storage, so they still show if the save fails.

| # | Trigger | Recipient | Status |
| :-: | :--- | :--- | :--- |
| B1 | A booking earns loyalty points ("Loyalty Points Earned") | The booker | Working |
| B2 | A cart checkout finishes ("Batch Checkout Successful") | The buyer | Working |
| B3 | A pass is cancelled without a refund because the policy does not allow it | The pass owner | Working |
| B4 | Auto-booking is switched on for a space | The user | The message is sent, but auto-booking itself is only a switch held in the browser's memory: nothing books automatically and the setting is lost on reload |
| B5 | A booking status is changed from the interface ("Booking cancelled", etc.) | The booking owner | Working |

## 4. Emails (Resend)

All five emails are sent through `lib/mailer.ts` from the address in `RESEND_FROM_EMAIL` (default `Coworking Pass <onboarding@resend.dev>`).

| # | Email | Trigger | Sender (cause) | Recipient | Used by | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| E1 | **Verification code** (sign-up) | A new account is created, or someone signs up again with an unverified email | The new user | The user's email | `POST /api/auth/register` | Sends a random six-digit code valid for 10 minutes (hashed in the database, one use, five wrong guesses at most). Delivery depends on Resend (section 5) |
| E2 | **Verification code** (sign-in) | Every successful password check | The user | The user's email | `POST /api/auth/login` | Same kind of random code as E1, purpose LOGIN. Delivery depends on Resend (section 5) |
| E3 | **Partner approved** | A Super Admin approves a partner | **Super Admin** | The partner's contact email | `PUT /api/partners/{id}` | Sends. The "Sign In" button points to a fixed old address (section 6) |
| E4 | **Partner rejected** (with the reason) | A Super Admin rejects a partner | **Super Admin** | The partner's contact email | `PUT /api/partners/{id}` | Sends. No in-app copy (the partner cannot sign in) |
| E5 | **Password reset code** | The user asks to reset a forgotten password | The user | The account's email | `POST /api/auth/forgot-password` | Sends a random six-digit code valid for 10 minutes (the answer to the screen is the same whether or not the account exists; suspended or unverified accounts get no code) |

## 5. Are the emails actually working?

**Until the Resend key and a verified domain are set up, treat all emails as not delivered to real people.**

* While `RESEND_FROM_EMAIL` is not set the sender is `onboarding@resend.dev`, Resend's shared test address, which only delivers to the email address of the Resend account owner. Set `RESEND_FROM_EMAIL` to an address on a domain verified in Resend (for example `Coworking Pass <no-reply@yourdomain.com>`).
* `RESEND_API_KEY` must be set on the backend. **Without a real key nothing is emailed: the one-time codes are printed in the backend console instead** (`[OTP] ... code for <email> is: ...`), so local and QA runs keep working. Once a key is configured, codes are never logged.
* A refusal from Resend is now logged (`[Email] Resend refused ...`) and reported to the caller as "not sent". The screen still says the code was sent, because for sign-in and password reset the answer must not reveal whether the account exists.
* The shared test code `123456` is accepted only when the backend runs with `ALLOW_MASTER_OTP=true` (local launch configuration and QA). Leave it unset in production.

To confirm the current state on the live backend, open the Render backend log and look for `Error sending OTP email`, or send a test email from the Resend dashboard.

## 6. Gaps, defects and things the plan promised but the code does not do

### Promised in earlier documents but not implemented

| Promised event | Reality |
| :--- | :--- |
| Booking confirmation by email | Not implemented. Only the in-app message exists (S3, S4). |
| Pass or hour-package purchase confirmation | Nothing is sent: creating a subscription (`POST /api/subscriptions`) creates no notification. |
| Email for waitlist promotion, cancellation, refund, payment | Not implemented (in-app only). |
| Payment **failure** notification | The type `PAYMENT_FAILED` exists but nothing creates it. |
| Wallet deposit notification | No dedicated message. A deposit only produces S8 when the browser also records a payment. |
| "New partner application under review" email to the partner | Not implemented. Only the Super Admin gets an in-app message (S1). |
| Password recovery code | **Built** (E5): `forgot-password`, `verify-reset-code`, `reset-password`. |
| Support ticket reply by email | In-app only (S12). |
| Subscription expiring in 7 days | The type `PASS_EXPIRING` exists but there is no job that sends it. The file `lib/cron/auto-booking.ts` is never loaded, so it does nothing. |
| "Pass assigned by the company" to an employee | Not implemented. Passes are not assigned to individual employees on the server. |
| Monthly settlement notice to partners | The type `PAYOUT_PROCESSED` exists but nothing creates it. |
| Loyalty points earned or redeemed (server side) | Only the browser message B1. The types `POINTS_EARNED` and `POINTS_REDEEMED` are unused by the server. |
| Loyalty-rule decision | Nothing is sent when a Super Admin approves or rejects a loyalty rule. (Amenity decisions are sent by the server, S21.) |
| A venue partner told about a new booking at their venue | Not implemented. Partners only see bookings when they open their dashboard. |
| `ACCOUNT_VERIFIED` after email verification | The type exists but is never created. |

### Defects found while auditing

1. ~~Master code.~~ **Changed:** codes are random, stored hashed, expire after 10 minutes and are never logged once a Resend key exists. The shared test code `123456` remains only behind `ALLOW_MASTER_OTP=true`; it must be unset in production (see `PRODUCTION_CHECKLIST.md`).
2. ~~Approval email link.~~ **Fixed:** the button now points to `NEXT_PUBLIC_SITE_URL` (or `FRONTEND_URL`).
3. **Mislabelled type.** S1 ("New Space Partner Application") is stored with the type `PARTNER_APPROVED`, which makes the admin's icon and filtering treat it as an approval.
4. ~~Amenity request to admin.~~ **Fixed:** the browser used to map the target `admin` to the signed-in user, so the notification landed on the partner's own account. The server now notifies every Super Admin (S20) and tells the partner the decision (S21); the browser no longer creates these messages.
5. **Hourly cancellation.** Cancelling an hourly booking through `DELETE /api/hourly-bookings/{id}` creates no notification (the refund path S9 does).
6. **Email failures are only logged.** A refusal from Resend is logged and returned as "not sent", but the interface cannot tell the user the code did not arrive.
7. **English-only emails.** Arabic-speaking users receive English email text.
8. **No delivery tracking.** There is no record of which emails were sent or failed, and no retry.

### Recommended work to close the gaps (not done yet)

1. Verify a sending domain in Resend, set `RESEND_API_KEY` and a real `from` address, and move the link in E3 to an environment variable.
2. Add Arabic versions of the four emails, chosen by the user's saved language.
3. Add emails and in-app messages for booking confirmation, cancellation, refund and pass purchase.
4. Build the password reset flow (code email, expiry, single use).
5. Add the partner "new booking" message and the pass-expiry reminder job.
6. Fix defects 3 to 5 above.

## 7. Notification types in the database

`BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `WAITLIST_PROMOTED`, `WAITLIST_JOINED`, `MEETING_BOOKED`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `PASS_ASSIGNED`, `PASS_EXPIRING`, `ACCOUNT_VERIFIED`, `POINTS_EARNED`, `POINTS_REDEEMED`, `PAYOUT_PROCESSED`, `PARTNER_APPROVED`, `AMENITY_REQUEST_STATUS`, `SUPPORT_TICKET`.

Types never created by the server: `PAYMENT_FAILED`, `PASS_EXPIRING`, `ACCOUNT_VERIFIED`, `POINTS_EARNED`, `POINTS_REDEEMED`, `PAYOUT_PROCESSED`.

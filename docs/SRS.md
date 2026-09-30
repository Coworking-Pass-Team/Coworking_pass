# Software Requirements Specification (SRS)
**Project: Coworking Pass**

## 1. Introduction
Coworking Pass is an aggregator platform that gives freelancers and companies a flexible way to reach many shared workspaces through a subscription or a flexible booking, breaking routine and reducing fixed subscription costs.

The platform also offers a large "unified network" model that lets individuals and companies buy the **Universal Pass**. The Universal Pass is a single subscription (available daily, monthly or yearly) that gives seamless access to any partner workspace in the Kingdom without a separate subscription for each brand. **To guarantee fair use and prevent seat hoarding, a pass holder must hold a seat in one workspace (only) at a time. They can switch to another space later for free, provided a seat is available there.**

## 2. User Types and Permissions (User Roles & Permissions)
The system is architected to serve 5 user types, each with specific permissions and features.

### A. Guest
An unregistered user browsing the platform for the first time.
* **Permissions:** read and browse only.
* **Features**
  * Browse the list of available workspaces.
  * View each space's details (location, photos, amenities, rating).
  * View plan prices (daily, monthly, yearly) and Universal Pass options.
  * Create a new account (individual, organization, or workspace partner).

### B. Individual User
A freelancer or student looking for a flexible work seat.
* **Permissions:** manage their personal account, bookings, Universal Pass, digital wallet and support tickets.
* **Features**
  * **Flexible booking:** book a seat by day, month or year.
  * **Digital wallet:** prepay a balance, pay quickly with one click, and receive refunds instantly.
  * **Waitlist and auto-booking:** when a space is full, the user sees an availability timer and can enable "auto-booking" so the system books the seat as soon as the current occupant leaves.
  * **Universal Pass:** buy a comprehensive subscription (daily, monthly, yearly) that gives access to the whole partner network while holding one space at a time. Unlimited-booking plans* are subject to the fair-use policy of a maximum of **5 bookings per week**.
  * **QR verification:** generate a temporary dynamic QR code (TOTP) on their device to be scanned on arrival.
  * **Cancellation and refund engine:** cancel a booking or pass within the regulated window and choose an instant wallet refund or a refund to the bank card.
  * **Ticketing and support:** open inquiry or complaint tickets and follow replies with the platform administration.
  * **Loyalty points:** earn points automatically and redeem them for free bookings.
  * **Personal dashboard:** track booking history, financial balance and points.

### C. Organization User (HR Admin)
Companies or teams looking for closed offices, meeting rooms, or remote-work benefits for their employees.
* **Permissions:** manage company bookings, seats, the organization's shared wallet, and corporate support tickets.
* **Features**
  * All individual-user features.
  * **Corporate shared wallet:** top up a central company cash balance (`Company.balance`) that lets company employees use it for bookings directly.
  * **B2B bulk Universal Passes:** buy and distribute pass quotas to registered employees (the plan appears as "Unlimited*" but is technically bound by the fair-use rule of a maximum of **5 bookings per week per employee**).
  * **Employee management and tracking:** a dashboard to monitor employee consumption and their usage of the various branches.
  * **Corporate support tickets:** raise and follow support tickets for the company's subscriptions.
  * **Interface scope:** the organization menu has no "Company Workspaces" page, and its plans are limited to Team Pass and Business Pass.

### D. Workspace Partner
The actual owners or managers of coworking spaces (for example Zamakan, Regus) who joined the Coworking Pass network.
* **Permissions:** manage their venues and rooms, scan verification codes, and follow profits and monthly settlements.
* **Strict administrative approval**
  * Registration requires entering a **Saudi commercial registration (CR / `taxNumber`)**.
  * A partner account is created as **pending (`PENDING_APPROVAL`)** and is blocked from the system with `HTTP 403 Forbidden` until the top administration verifies the registration and activates it.
* **Operational features**
  * **QR verification and scanner:** use the camera to scan dynamic codes and verify a booking's validity.
  * **Venue and room management:** add the venue with its general details (in Arabic and English), then add **multiple rooms and sections** under one venue (meeting rooms, theaters, private or dedicated offices), each with its own name, type, capacity and rates (hourly, daily, monthly, yearly); set operating hours and show or hide the space.
  * **Amenity management:** choose the available amenities and propose new ones for review by the Super Admin.
  * **Loyalty rule proposals:** submit proposals for promotional campaigns based on point multipliers.
  * **Financial reports:** track confirmed visits and the expected net revenue transferred monthly.

### E. Super Admin
The platform's top administration (the Coworking Pass team).
* **Permissions:** full access and CRUD on all system data, and administrative and security control.
* **Features**
  * **Partner verification:** review a new partner's commercial-registration data and accept the account (`APPROVED`) with a welcome email through Resend, or reject it (`REJECTED`) with reasons.
  * **User moderation:** suspend any suspicious or abusive account immediately (`isBanned = true`) or lift the suspension, which blocks sign-in and any booking.
  * **Support ticket management:** reply to customer and company tickets and move their status from `OPEN` to `IN_PROGRESS` and `CLOSED`.
  * **Wallet and refund oversight:** monitor deposited balances, execute financial refunds for passes and bookings, and record ledger entries.
  * **Automated reports and settlements:** manage the monthly payout cycles for partners and transfer their dues.
  * **Amenity and point-rule approval:** review and accept or reject partner proposals.

---

## 3. Detailed User Stories

### Guest stories
* **As a guest,** I want to browse the available workspaces and see their prices, photos and amenities, so that I can decide whether they suit me.
* **As a guest,** I want to register a new account (as an individual, company or workspace partner) easily and securely.

### Individual user stories
* **As an individual,** I want to book a seat for a day, a month or a year, so that I can work comfortably for the period that suits me.
* **As an individual,** when I find a space full, I want to know when it becomes available and enable "auto-booking" in the waitlist.
* **As an individual,** I want to top up my digital wallet so that I can pay for my future bookings and passes instantly with one click.
* **As an individual,** I want to cancel my booking or pass and get the money back immediately in my digital wallet within the regulated window, without waiting for bank business days.
* **As an individual,** I want to switch the platform language between Arabic and English with one click, with the direction (RTL/LTR) flipping correctly.
* **As an individual,** I want to open a support ticket from my dashboard when I face any inquiry or problem, so that I get a documented response from the platform administration.
* **As an individual (Universal Pass),** I want to buy a Universal Pass and use it to book a seat in a specific space each day so that I can move freely across the branch network.
* **As an individual (QR entry),** I want to generate a dynamic QR code on my phone, to show to reception and have my entry verified in seconds.
* **As a customer,** I want to choose the specific room (hall, theater or desk) and see its available sessions, capacity and price before booking.

### Organization (HR Admin) stories
* **As an HR manager,** I want to top up the unified corporate wallet (`Company.balance`) so that the company's employees can book spaces without individual payments.
* **As an HR manager,** I want to buy and assign Universal Passes to my company's employees, follow their consumption and usage statistics, and be able to cancel and refund any pass before its start date.
* **As an HR manager,** I want to raise corporate support tickets to follow the team's needs directly with the platform officials.

### Workspace partner stories
* **As a workspace partner,** I want to register my branch with my Saudi commercial registration (CR) and receive an email alert when the platform administration approves my account, so that I can begin offering my seats.
* **As a workspace partner,** I want reception staff to scan the customer's QR code on their mobile device, so that the platform immediately confirms the booking's validity and records the visit for my dues.
* **As a partner,** I want to add several rooms and sections under one venue, with an independent capacity and price for each room, without having to create duplicate spaces.
* **As a partner,** I want to enter my space's name, description and address in Arabic and English, so that customers see them in their own language.
* **As a partner,** I want to propose new amenities and additional loyalty rules to raise my space's appeal and competitiveness.

### Super Admin stories
* **As a system administrator,** I want an interface to review partner applications and verify their commercial registration numbers, accept or reject the account with one click, and send an automatic email notification to the partner.
* **As a system administrator,** I want to be able to suspend any user who violates the policies (`isBanned`) immediately, to block their sign-in and any new bookings.
* **As a system administrator,** I want to view support tickets and reply to them, moving their status between open, in progress and closed, to ensure service quality.
* **As a system administrator,** I want an automated financial-settlement system that calculates each partner's dues from the confirmed QR scans each month.

---

## 4. Functional Requirements

> Note: every requirement carries a unique identifier in the form `[FR-XXX-##]` to make it easy to link to development tasks and test cases.

### A. User Management and Authentication (Authentication & Moderation)
* **[FR-AUTH-01]** Sign-in and account creation (individuals, companies, partners) with email verification (OTP), using Resend for transactional messages.
* **[FR-AUTH-02]** Password recovery through OTP, invalidating previous sessions as soon as the password changes.
* **[FR-AUTH-03]** Profile and permission management with a strict role-based access control (RBAC) system.
* **[FR-AUTH-04] Partner commercial-registration approval cycle (Space Partner CR Verification):**
  * *Description:* when a new account is registered with the `PARTNER_ADMIN` role, the system requires the commercial registration (`taxNumber`). The account is created as `PENDING_APPROVAL`.
  * *Acceptance criteria:* a pending partner is blocked from signing in with `HTTP 403 Forbidden` and a clear message. The request appears in the Super Admin dashboard, and once approved the status changes to `APPROVED` and an activation email is sent automatically through **Resend**.
* **[FR-AUTH-05] User moderation and suspension:**
  * *Description:* the Super Admin can change the users' `isBanned` field.
  * *Acceptance criteria:* once a suspension is enabled (`isBanned = true`), any authentication or booking attempt by the user is rejected with `HTTP 403 Forbidden` stating the account is suspended for policy violations.
* **[FR-AUTH-06] Country-code picker and standard phone validation:**
  * *Description:* provide a country drop-down (Country Code Picker) with a standard library for handling phone numbers, instead of checking only with a fixed Saudi regular expression.
  * *Acceptance criteria:* the default country is Saudi Arabia (`+966`) with the 🇸🇦 flag, with the ability to switch to any country worldwide (for example `+971`, `+20`, `+44`, `+1`), and the number's length and validity are checked automatically by a standard international library (E.164 format) before registration is accepted.

### B. Booking and Membership System
* **[FR-BOOK-01]** Direct booking of desks (daily, monthly, yearly), with hourly booking of open desks prevented.
* **[FR-BOOK-02]** Unified hour packages for meeting rooms and theaters (one category in software and operations) with flexible hours (hours per day or hours per month), precise consumption accounting, the ability to cancel a booking and return unused hours to the package credit, and unified loyalty points earned from them.
* **[FR-BOOK-03]** Universal Pass support:
  * The fair-use constraint (a seat in one workspace only per session, with free switching).
  * **Unlimited-booking plans:** plans appear to users and companies as "Unlimited*" and are technically subject to the fair-use policy of a maximum of **5 bookings per week** per active user or employee, to prevent abuse and hoarding of resources.
  * A unified monthly hours credit for meeting rooms and theaters (for example 8 hours per month for the monthly plan, 20 hours for the yearly plan, and corporate plans from 10 hours up to unlimited-booking* plans limited to 5 bookings per week), deducted automatically when the QR code is scanned.
* **[FR-BOOK-04]** A waitlist and auto-booking system, with a 15-minute window to confirm the booking when a seat becomes free.
* **[FR-BOOK-05] Fixed sessions and operating hours for halls and theaters:**
  * *Description:* halls and theaters are booked in fixed sessions of two hours, separated by a one-hour turnaround, inside the venue's operating hours `openingTime`–`closingTime` (or 24 hours when `is24Hours`), ending no later than 10:00 PM.
  * *Acceptance criteria:* the server rejects (HTTP 400) any hourly booking outside operating hours or with a duration other than two hours, and rejects hourly booking of individual desks. The interface shows only valid sessions.
* **[FR-BOOK-06] Per-session, per-room availability (slot-based availability):**
  * *Description:* capacity, availability and the available/busy indicators are calculated for the selected session and room, not for the whole day.
  * *Acceptance criteria:* booking a session (for example 11:00–13:00) of a room does not prevent booking a vacant session (14:00–16:00) of the same or another room, and the full room capacity (15/15) is shown for the vacant session. A booked session is displayed disabled. The server rejects any time-overlapping booking on the same room (HTTP 409) and rejects (HTTP 400) a number of seats larger than the room's capacity.
* **[FR-HUB-01] Hub → Rooms/Sections hierarchy:**
  * *Description:* one hub contains multiple rooms/sections (`WorkspaceSection`), each with `name`, `type` (DESK / MEETING_ROOM / THEATER), `subType`, `capacity`, and `hourlyRate` / `dailyRate` / `monthlyRate` / `yearlyRate`.
  * *Acceptance criteria:* the partner or admin adds rooms with the "+ Add Room / Section" button and the inventory is saved in the database; the hub's capacity becomes the sum of the rooms' capacities. A room that has bookings cannot be deleted. Empty rates fall back to the hub's rates.
* **[FR-HUB-02] Room selection in the booking flow:**
  * *Description:* on the details page and in the individual and team booking flows the customer selects the room, and the available plans, price, capacity and session grid update accordingly.
  * *Acceptance criteria:* the number of team seats does not exceed the selected room's capacity, and the booking carries the room's `sectionId` through `POST /api/hourly-bookings` and `POST /api/direct-bookings`, with capacity applied per room in a multi-room hub.
* **[FR-HUB-03] Mixed cart and combined checkout:** a hall and a theater by the hour and a daily office can be booked in a single checkout. Each item is saved according to its own plan (hourly, or direct daily/monthly/yearly), and a daily booking is not subject to the operating-hours rules that apply to sessions.

### C. Booking Lifecycle
* **[FR-LIFE-01]** Check-in by scanning the QR code, with the entry recorded in `QR_CHECK_INS`.
* **[FR-LIFE-02]** Automatic check-out at the end of the workday, updating the booking to `COMPLETED` and notifying the waitlist.

### D. Financial Operations, Wallets and Refunds
* **[FR-PAY-01]** Mock payment gateway simulation with support for Mada, Visa, MasterCard and Apple Pay cards.
* **[FR-PAY-02]** Automated partner financial settlements (Payouts) on the first day of each month, based on confirmed visits.
* **[FR-WALLET-01] Digital wallets and shared balance:**
  * *Description:* provide an independent digital wallet for each individual user (`Wallet`) and a unified corporate balance for each company (`Company.balance`).
  * *Acceptance criteria:* the user can top up their wallet and use its balance for bookings and packages. All operations are recorded in `WALLET_TRANSACTIONS` (and for companies in `COMPANY_WALLET_TRANSACTIONS`) and calculated accurately with the instant balance `balance_after` updated.
* **[FR-WALLET-02] Deduction integrity and the corporate shared wallet:**
  * *Description:* atomic deduction conditional on sufficient balance inside one database transaction, and an idempotency key (`referenceId`) for each operation.
  * *Acceptance criteria:* the balance can never go negative even with concurrent requests, and resending a request with the same key neither deducts nor deposits twice. An HR administrator can operate only on their own company's wallet.
* **[FR-WALLET-03] Automatic payment rollback when a booking fails:**
  * *Description:* when a booking or cart is paid from a wallet and the server then rejects one of the bookings (conflict, capacity or error), that booking's share of the deduction is returned to the same wallet (personal or corporate) with a derived refund key that prevents repetition.
  * *Acceptance criteria:* the customer sees a clear message with the returned amount, and the other successful bookings in the cart remain confirmed.
* **[FR-REFUND-01] Automated cancellation and refund engine (Direct Bookings vs Packages):**
  * *Description:* a smart system that separates precisely between the policies of direct bookings bound to seats and times and flexible subscription packages:
    * **Direct bookings of desks and meeting rooms:** cancellation is available **6 hours** before for individuals (B2C) and **24 hours** before for organizations (B2B) from the booking start time, to enable waitlist promotion.
    * **Universal Pass subscriptions:** the user or company is entitled to a full refund of the pass within **3 days (72 hours)** of purchase, provided **no visit has been used (`visitsUsed == 0`)**; the automatic refund is void as soon as any visit is used.
    * **Hourly packages:** unused hours are returned to the customer's credit when the session is cancelled before its time (6 hours for individuals, 24 hours for companies), with the option to refund the package's monetary value in full within 3 days of purchase if nothing has been consumed.
  * *Acceptance criteria:* when the booking or package is eligible, an "instant refund to wallet" option is offered and the amount is added immediately with no delay, or a "refund to bank card" option within 5 to 14 business days. The booking status is updated to `REFUNDED` and recorded as an official refund entry.
  * *Atomicity:* the refund (updating the booking or pass status, the `REFUND` entry and the wallet entry) runs in one transaction, and refunding the same booking or pass twice is not accepted. The value of corporate accounts' bookings is returned to the shared corporate wallet.
  * *72-hour pass policy:* a pass refund is available only within 72 hours of purchase and only with `visitsUsed == 0`; the request is rejected afterwards with a message explaining why.

### E. Verification System (QR Code)
* **[FR-QR-01]** Generate a time-varying dynamic QR code (TOTP) that renews every 30 seconds to prevent forgery.
* **[FR-QR-02]** A quick check interface for reception staff that confirms a booking's validity in under 500 milliseconds.

### F. Amenities, Tickets and Notifications
* **[FR-FEAT-01]** Manage workspace amenities, with partners able to propose custom amenities that the administration approves.
* **[FR-SUPP-01] Support ticketing system:**
  * *Description:* enable users and companies to create support tickets (`Ticket`) and follow replies (`TicketReply`).
  * *Acceptance criteria:* track the ticket lifecycle through its three states (`OPEN`, `IN_PROGRESS`, `CLOSED`). Replies are saved in `TicketReply` and shown as a conversation in the admin panel, and the admin can reply even to a closed ticket. A ticket carries `message`, `category` (general / complaint / refund / enterprise) and `priority`, and the company is resolved on the server from the requester's record.
  * *Enterprise inquiries:* the `enterprise` category is supported for tailored-offer requests; such a ticket reaches the administrators as an in-app notification (type `SUPPORT_TICKET`) and appears in a separate tab.
* **[FR-NOTIF-01]** Send automatic notifications by email (Resend) and in-app for the various key events.

**Notification table**

| Event | Channel | Recipient |
| :--- | :--- | :--- |
| Account creation and email verification (OTP) | Email | User / Partner |
| New partner application (under review) | Email | Partner |
| Partner account approved and activated | Email | Partner |
| Partner application rejected with the reason | Email | Partner |
| Booking confirmation (desk / theater / hall) | Email + in-app | User |
| Universal Pass or hour package purchase confirmation | Email + in-app | User |
| Promotion from the waitlist | Email + in-app | User |
| Booking or package cancellation and refund (Wallet/Card) | Email + in-app | User |
| Digital wallet deposit | In-app | User |
| Payment success / failure | Email + in-app | User |
| New reply on a support ticket | In-app + email | User / Company |
| New support ticket (including the enterprise category) | In-app | Super Admin |
| Loyalty points earned / redeemed | In-app | User |
| Subscription about to expire (7 days before) | Email + in-app | User |
| Pass assigned by the company | Email + in-app | Employee |
| Monthly financial settlement completed | Email | Partner |
| Amenity or point rule accepted / rejected | In-app | Partner |

### G. Internationalization
* **[FR-I18N-01] Dual-language engine and direction:**
  * *Description:* support Arabic (the default) and English with a language switcher in the top bar (🇸🇦 العربية / 🇬🇧 English) next to the user's avatar.
  * *Acceptance criteria:* the choice is stored locally and applied before the page is painted. In Arabic, `lang="ar" dir="rtl"` is set, layouts, spacing and directional icons flip, and the Tajawal font is used, with no breakage or horizontal overflow on the main screens (verified on desktop and mobile).
* **[FR-I18N-02] Strictly typed translation dictionaries:** all static text (navigation, footer, browse and filters, space details, authentication, individual, organization, partner and admin dashboards, dialogs and alerts) comes from `ar`/`en` dictionaries, and the build fails if the two dictionaries differ in shape.
* **[FR-I18N-03] Bilingual workspace content:** `Workspace` has the fields `nameAr`, `descriptionAr`, `addressAr` and `cityAr` next to the English versions, entered by the partner or admin in the workspace form. The Arabic version is shown in Arabic mode with a graceful fallback to English when missing, and no machine translation is used.

### H. Security and Governance
* **[FR-SEC-01] Access control and ownership scope**
  * `GET/POST /api/payouts`: the Super Admin for all; a partner for their own payouts only (and creates only a pending record for themselves); anyone else gets HTTP 403.
  * `POST/PUT/DELETE /api/workspace-sections`: the owning partner or the Super Admin only, with an allow-list of fields on edit.
  * `GET /api/stats`: the Super Admin only.
  * `GET /api/hourly-bookings` and `GET /api/direct-bookings`: a user sees their own bookings, a partner sees their own spaces' bookings only (and their own personal bookings), an HR administrator sees their team's (hourly) bookings, and the Super Admin sees all.
* **[FR-SEC-02] Permanent account suspension:** a ban is stored in the database (`isBanned`) and checked on every authenticated request. The server returns `HTTP 403` with the code `ACCOUNT_SUSPENDED`, and the interface shows a non-dismissible suspension modal.
* **[FR-SEC-03] Cascading deletion:** deleting a user, partner or workspace removes its related data in the correct order while preserving foreign-key integrity (payments are detached from the space and not deleted).
* **[FR-SEC-04] Hidden spaces:** a space with `isVisible = false` has neither its data returned nor its bookings accepted except for the Super Admin and its owning partner.
* **[FR-SEC-05] Session lifetime:** a JWT is valid for 24 hours and is revoked on logout.

### I. Open API Documentation (OpenAPI Documentation)
* **[FR-API-01] Interactive documentation of the open API:**
  * *Description:* provide an interactive Swagger UI at `/api-doc`.
  * *Acceptance criteria:* browse all endpoints, schemas and authorization keys (Bearer JWT), with the ability to try endpoints directly from the browser.

---

## 5. Non-Functional Requirements
* **Security and access control**
  * Password hashing with `bcryptjs`.
  * API routes authenticated with `JWT` and role checks (RBAC) applied.
  * Check the `isBanned` status and the partner `ApprovalStatus` on every sign-in and API call.
  * QR code security through encrypted dynamic time-based codes (TOTP).
  * OTP protection and hashing, with a validity of at most 10 minutes.
  * **Financial operation integrity:** wallet deductions are atomic and conditional on balance inside database transactions, with idempotency keys and automatic payment rollback when a booking fails.
  * **Server-side validation:** operating hours, fixed sessions, capacity and time overlap are enforced on the server even if the interface bypasses its own restrictions.
* **Performance and responsiveness**
  * Load the workspace list and search in under two seconds.
  * Verify a QR scan in under 500 milliseconds.
  * Deposit instant refund amounts into the digital wallet in under 1 second of processing time.
* **Availability and reliability**
  * Fully cloud hosting of the interfaces and servers on **Render**, and a cloud database on **Neon**.
  * Availability of at least 99.5% per month.
  * Periodic database backups with the ability to restore in emergencies.
* **Localization and UX**
  * The interface works in two languages with full RTL, without horizontal overflow on the main screens on desktop and mobile.
  * Currency, dates and times are displayed according to the language.
* **Compliance and privacy**
  * Compliance with the Saudi Personal Data Protection Law (PDPL).
  * Documenting and matching the commercial registrations of Saudi partners before enabling any commercial activity on the platform.

---

## 6. Main User Flow
1. **Landing and exploration:** visit the platform and browse spaces and amenities through the application interfaces.
2. **Booking:** choose the required section and room (a shared desk, a meeting room with flexible hours, or a theater).
3. **Payment and wallet:** complete payment by bank card or from the prepaid digital wallet.
4. **Field access:** show the dynamic QR code to reception and be verified within seconds.
5. **Flexibility and cancellation:** cancel an eligible booking or package and get the money back instantly in the wallet, or raise a support ticket to follow any inquiry.

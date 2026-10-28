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
  * **QR verification:** show the QR code of a booking on their device to be scanned on arrival. The server accepts the check-in only when the person has a current booking at that venue.
  * **Cancellation and refund engine:** cancel a booking or pass within the regulated window and choose an instant wallet refund or a refund to the bank card.
  * **Ticketing and support:** open inquiry or complaint tickets and follow replies with the platform administration.
  * **Loyalty points:** earn points automatically and redeem them for free bookings.
  * **Personal dashboard:** track booking history, financial balance and points.

### C. Organization User (HR Admin)
Companies or teams looking for closed offices, meeting rooms, or remote-work benefits for their employees.
* **Permissions:** manage company bookings, seats, the organization's shared wallet, and corporate support tickets.
* **Features**
  * All individual-user features.
  * **Corporate shared wallet:** top up a central company cash balance (`Company.balance`). The balance is spent by the HR administrator when booking for the team; employee accounts do not draw on it directly (only `HR_ADMIN` and `SUPER_ADMIN` can use `POST /api/companies/{id}/withdraw`).
  * **B2B bulk Universal Passes:** buy and distribute pass quotas to registered employees (the plan appears as "Unlimited*" but is technically bound by the fair-use rule of a maximum of **5 bookings per week per employee**).
  * **Team management:** add existing member accounts to the team by email, approve or decline join requests from employees (FR-COMP-02), and remove members (FR-COMP-01). Department and team-role labels are kept only in the HR administrator's browser, and quotas are not yet recorded per employee on the server.
  * **Corporate support tickets:** raise and follow support tickets for the company's subscriptions.
  * **Interface scope:** the organization menu has no "Company Workspaces" page, and its plans are limited to Team Pass and Business Pass.

### C-2. Company Employee (member of a company team)
A person who works for a company that uses Coworking Pass. **This is not a separate role in the database**: the account is an ordinary Individual (`B2C`) account whose `User.companyId` points to the company (see section 2.F).
* **Permissions:** everything an Individual can do with their own account, plus a link to their company.
* **Features**
  * Sign up under "Organization / B2B → Company employee", entering the HR administrator's email, or ask to join later from the profile page. The HR administrator must approve (FR-COMP-02).
  * See the "Your company" card (company name, HR contact, team size) and the "Employee" badge. **An employee cannot leave the company**: only the HR administrator removes members, so seat allocation and HR records stay consistent.
  * The "Passes" link is hidden and the passes page redirects an employee to their dashboard with an explanation: access comes from the company's corporate plan. (Known gap: the server only checks for a company link, so it would still accept a company plan from an employee account; only the interface hides it.)
  * See in the header and the wallet window their **own** wallet only. It holds whatever the HR administrator allocated to them (FR-COMP-04), and they book with it like any other balance. **The company's balance and wallet are never shown to employees**, and the server leaves them out of the company record an employee can read.
  * See, under their own bookings, the sessions and desks the HR administrator booked for them, with the booking details and their own check-in QR code (FR-COMP-05). They can view and check in, but not cancel or reschedule them.
  * Cannot add or remove team members or see other employees' bookings.


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
  * **Reports and settlements:** manage the monthly payout cycles for partners and transfer their dues (recorded manually; there is no automatic scheduler yet).
  * **Amenity and point-rule approval:** review and accept or reject partner proposals.

### F. Role Model and Permission Hierarchy (RBAC)

**How roles are stored.** The database enum `Role` has five values: `GUEST`, `B2C`, `HR_ADMIN`, `PARTNER_ADMIN`, `SUPER_ADMIN`. `GUEST` is a signed-out visitor and is never stored on an account. The JWT carries the role and every protected route checks it.

**Where company employees fit.** There is **no dedicated employee role**. A company employee is a `B2C` user whose `User.companyId` is set. The company itself is the `Company` table; its HR administrator is the single `HR_ADMIN` user referenced by `Company.hrAdminId` (unique, so one company per HR administrator). The relationship is therefore *role + company link*, not a role of its own:

| Persona | Stored as | Company link |
| :--- | :--- | :--- |
| Guest | not stored | none |
| Individual member | `role = B2C` | `companyId = null` |
| Company employee | `role = B2C` | `companyId = <company id>` |
| HR administrator (company owner) | `role = HR_ADMIN` | referenced by `Company.hrAdminId` |
| Workspace partner | `role = PARTNER_ADMIN` | linked to a `Partner` record by contact email |
| Super Admin | `role = SUPER_ADMIN` | none |

An employee joins a company in one of two ways: the HR administrator adds an existing member by email, or the employee sends a join request that the HR administrator approves (`CompanyJoinRequest`, FR-COMP-02). Leaving or removal clears `companyId`.

**Hierarchy.** It is not a single ladder. The Super Admin sits above everyone. The Partner and the HR administrator are two separate branches that never see each other's data. The company employee is an Individual with one extra link.

```
Super Admin  (everything, including other roles' data)
 ├── Partner (PARTNER_ADMIN)   own venues, rooms, bookings, QR scans, payouts
 ├── HR administrator (HR_ADMIN)  own company: wallet, team, join requests, team bookings
 │     └── Company employee (B2C + companyId)   own account + the company link
 └── Individual member (B2C)  own account only
       └── Guest  (browse only)
```

**Permission matrix** (✔ allowed, — not allowed, "own" = only their own records):

| Capability | Guest | Individual | Company employee | HR admin | Partner | Super Admin |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: |
| Browse venues and prices | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Book rooms and desks, personal wallet, QR code, tickets | — | ✔ own | ✔ own | ✔ own | ✔ own | ✔ |
| Buy individual (B2C) plans | — | ✔ | — (blocked by the server) | — (blocked: the HR administrator also belongs to the company) | — | ✔ |
| Buy company plans (Team, Business) | — | — | — in the interface (the server only requires a company link) | ✔ own company | — | ✔ |
| Top up the company wallet | — | — | — | ✔ own company | — | ✔ |
| Allocate company funds into employees' wallets | — | — | — | ✔ own company | — | ✔ |
| See the company wallet balance | — | — | — (never shown) | ✔ own company | — | ✔ |
| Add or remove team members | — | — | — | ✔ own company | — | ✔ |
| Approve or decline join requests | — | — | — | ✔ own company | — | ✔ |
| Ask to join a company | — | ✔ ask | — | — | — | — |
| Leave a company | — | — | — (only the HR admin removes members) | — | — | ✔ remove anyone |
| See the team's bookings | — | — | own, plus those made for them | ✔ own team | — | ✔ |
| Reschedule a booking | — | ✔ own, once | ✔ own, once (not those made for them) | ✔ own and company-paid, once | — | ✔ any |
| My tickets: read and answer own support tickets | — | ✔ | ✔ | ✔ | ✔ | — (uses the admin dashboard) |
| Cancel or refund a booking | — | ✔ own, inside the window | ✔ own, inside the window | ✔ own, inside the window | — | ✔ any, no window |
| Create venues, rooms and amenities | — | — | — | — | ✔ own | ✔ all |
| Scan customers' QR codes | — | — | — | — | ✔ own venues | ✔ |
| Approve partners, suspend users, reply to tickets, payouts, reports, settings | — | — | — | — | — | ✔ |

**Cancellation and rescheduling window by role.** The server applies the window of the booking **owner's role**: 6 hours when the owner is `B2C` (this includes company employees, even when the company pays), 24 hours otherwise (HR administrators). A Super Admin is not bound by the window. *Open decision:* the business intent is 24 hours for company-funded bookings, which the code does not yet distinguish from an employee's personal booking.

**Enforcement.** Ownership is checked on every booking, payment, wallet and record route (`FR-SEC-01`); suspended accounts (`isBanned`) are refused on every call (`FR-SEC-02`); pending or rejected partners cannot sign in (`FR-AUTH-04`).



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
* **As an individual (QR entry),** I want to open my booking's QR code on my phone, to show to reception and have my entry verified in seconds.
* **As a customer,** I want to choose the specific room (hall, theater or desk) and see its available sessions, capacity and price before booking.

### Organization (HR Admin) stories
* **As an HR manager,** I want to top up the unified corporate wallet (`Company.balance`) so that the company's employees can book spaces without individual payments.
* **As an HR manager,** I want to buy and assign Universal Passes to my company's employees, follow their consumption and usage statistics, and be able to cancel and refund any pass before its start date.
* **As an HR manager,** I want to raise corporate support tickets to follow the team's needs directly with the platform officials.

### Company employee stories
* **As a company employee,** I want to sign up with my company's HR email and have my HR administrator approve me, so that my account is linked to the company without anyone being able to add themselves to it.
* **As a company employee,** I want to see which company I belong to and to find the funds my company gave me in my own wallet, so that I can book without paying out of my own pocket.
* **As a company employee,** I want the sessions and desks my HR manager booked for me to appear in my own bookings with my check-in QR code, so that I can walk in without asking anyone.
* **As an HR manager,** I want to approve or decline employees who ask to join my company, give money from the company wallet to all employees equally or to chosen employees, and be the only one who can remove people from the team.

### Rescheduling stories
* **As an individual or employee,** I want to move a booking to another free slot, once and free of charge, as long as I ask early enough (6 hours before the start, 24 hours for company bookings), so that I do not lose the booking when my plans change.
* **As an HR manager,** I want to reschedule a team booking paid from the company wallet, with any price difference settled on the company wallet.

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
* **[FR-AUTH-01]** Sign-in and account creation (individuals, companies, partners) with email verification by one-time code (OTP), using Resend for transactional messages (FR-SEC-08). Real delivery needs a verified Resend domain (see `Notifications_and_Emails.md`); until a Resend key is configured the code is printed in the server console instead.
* **[FR-AUTH-02]** Password recovery through a one-time code: `POST /api/auth/forgot-password` emails a code (the answer is the same whether or not the account exists, and a new code cannot be requested for 30 seconds), `POST /api/auth/verify-reset-code` checks it without using it up, and `POST /api/auth/reset-password` sets the new password (checked against the password policy, FR-AUTH-03, and stored with bcrypt) and ends the account's other sessions and waiting codes. The "Forgot password" screens use these endpoints. *Status:* implemented; email delivery needs the Resend setup.
* **[FR-AUTH-03] Password policy:** `POST /api/auth/register` and `POST /api/auth/reset-password` refuse a password that breaks the password policy: at least 8 characters, a lowercase letter, an uppercase letter, a number and a special character, and no sequential characters (three letters or digits in a row going up or down, such as `123` or `abc`). The answer is `400 { error, code: "WEAK_PASSWORD", failed: [rules] }`. The sign-up and reset screens show the same rules as a live checklist (each rule red until met, then green) and a confirm-password field that says whether the two match; the save button stays disabled until both are satisfied. *Status:* implemented (`backend/lib/auth/password-policy.ts`, `frontend/lib/password-policy.ts`).
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
  * **Unlimited-booking plans:** plans appear to users and companies as "Unlimited*" and are technically subject to the fair-use policy of a maximum of **5 bookings per week** per active user or employee, to prevent abuse and hoarding of resources. *Status:* enforced by the server (`lib/booking/fair-use.ts`) for meeting room and theater sessions: a person on the Business Pass or Custom Enterprise (their own pass or their HR admin's) can hold at most 5 non-cancelled sessions per Saudi week (Sunday to Saturday). Company sessions count against the members they were booked for, not the HR admin. A sixth booking, or moving a session into a full week, is refused with `FAIR_USE_LIMIT`.
  * A unified monthly hours credit for meeting rooms and theaters (for example 8 hours per month for the monthly plan, 20 hours for the yearly plan, and corporate plans from 10 hours up to unlimited-booking* plans limited to 5 bookings per week), deducted automatically when the QR code is scanned.
* **[FR-BOOK-04]** A waitlist and auto-booking system, with a 15-minute window to confirm the booking when a seat becomes free. *Status:* the 15-minute confirmation window is not implemented; a promoted waitlist entry is confirmed immediately. *Status:* joining the waitlist and promotion when a direct booking is cancelled work on the server; "auto-booking" is currently only a switch held in the browser and does not book automatically.
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

* **[FR-BOOK-07] Booking rescheduling (Reschedule):**
  * *Current status:* **implemented** (`POST /api/hourly-bookings/{id}/reschedule`, `POST /api/direct-bookings/{id}/reschedule`, and a "Reschedule" action on My Bookings and on the HR team bookings page). The generic booking `PUT` was locked at the same time: only a Super Admin can change a date, room or plan there; everyone else can only cancel, and a cancelled or refunded booking cannot be brought back (before, the owner could change the date and room with no window, capacity or price check).
  * *Description:* let the booking owner move a not-yet-started booking to another free slot instead of cancelling it, under these business rules:
    1. **Eligible bookings:** an active hourly session (meeting room or theater) or a confirmed direct booking (daily; monthly or yearly seat only before it starts). Not eligible: started, completed, cancelled, refunded or waitlisted bookings (a waitlist entry is cancelled and re-joined), and Universal Pass subscriptions themselves.
    2. **Notice period (same as cancellation):** the request must be made at least **6 hours** before the original start for an individual or employee account (their own wallet, including money the company allocated to it) and **24 hours** for an HR administrator. A Super Admin may override.
    3. **New slot:** it must start at least the same notice period from now, fall inside the venue's operating hours and the fixed two-hour session grid (FR-BOOK-05), stay within 30 days after the original date, and pass the same capacity and overlap checks as a new booking (FR-BOOK-06). Same venue and same room type; another room of that venue is allowed.
    4. **Limit:** one free reschedule per booking. Further changes are done by cancelling (if still inside the window) and booking again.
    5. **Price:** same room and duration means no charge. A different room is priced by scaling what was paid (discounts, VAT and points included) by the new room's rate over the old room's rate. A difference upward is charged to the wallet that paid (the company wallet for an HR administrator's booking, otherwise the owner's own wallet) and is refused when the balance does not cover it; a difference downward is refunded to that wallet. The recorded payment is updated to the new total, so a later cancellation refunds exactly what is now paid. A booking covered by a pass has no payment, so nothing is charged (the pass hours are tracked in the member's quota).
    6. **Approval:** none. The change is instant when the slot is free; the venue partner and the people the booking was made for are told.
    7. **Atomicity:** the old slot release, the new slot reservation, the booking update and any price difference run in one database transaction. The released slot is offered to the waitlist (FR-BOOK-04). The booking keeps its identifier, so its QR code stays valid, but only for the new slot.
    8. **Refusals:** the server answers with a reason code: `RESCHEDULE_WINDOW`, `RESCHEDULE_LIMIT`, `NOT_ELIGIBLE`, `NOT_CHANGED`, `SLOT_TOO_FAR`, `ROOM_NOT_ALLOWED`, `INVALID_SLOT`, `SLOT_UNAVAILABLE` (409), `CHANGED` (409), `FORBIDDEN` (403) or `INSUFFICIENT_BALANCE`.
    9. **Records and messages:** the booking keeps the original start (`rescheduledFrom`) and a counter (`rescheduleCount`); an in-app message (title "Booking Rescheduled") goes to the owner, the people the booking was made for and the venue's partner. (No email yet.)
  * *Acceptance criteria:* a booking inside the notice period cannot be moved; a booking outside it can be moved once to a free slot and the old slot becomes bookable at once; the price difference is settled exactly once even if the request is repeated; two users cannot take the same new slot; every refusal shows a clear Arabic or English reason.

* **[FR-COMP-01] Company team stored on the server:**
  * *Description:* the HR administrator adds an existing `B2C` account to the team by email (`POST /api/companies/{id}/employees`) and removes members (`DELETE /api/companies/{id}/employees/{userId}`). **A member cannot remove themselves** (HTTP 403): the "Leave company" button was removed from the employee's interface and the server refuses it too. The HR administrator account cannot be removed.
  * *Acceptance criteria:* only the company's HR administrator (or a Super Admin) manages the team; accounts that are not `B2C`, are suspended, or already belong to another company are refused; the affected person gets an in-app notification when added or removed.
* **[FR-COMP-02] Company join requests:**
  * *Description:* a person can sign up as a **Company employee** by entering the HR administrator's email, or an existing member can ask to join from the profile page. A `CompanyJoinRequest` (`PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`) is created; for a new sign-up the HR administrator is notified only after the employee verifies their email. The HR administrator approves or declines from the team page or the dashboard (`GET/POST /api/company-join-requests`, `PATCH /api/company-join-requests/{id}`); the employee can withdraw a pending request (`DELETE`).
  * *Acceptance criteria:* one pending request per person; approval sets `User.companyId` and cancels the person's other pending requests; the employee is notified of the decision and sees the company on the next load without signing in again. A sign-up never accepts a raw company identifier from the browser.
* **[FR-COMP-03] Company membership display:** members see the company name, HR contact and team size on the dashboard and profile (without the colleagues' names or emails, and without the company's balance), an "Employee" badge in the header, and a notice that passes are arranged by the company. The "Passes" link and the passes page are not available to employees.
* **[FR-COMP-04] Allocating company funds to employees' wallets:**
  * *Description:* the HR administrator tops up the company wallet and then moves money into team members' **own personal wallets** from the team page ("Allocate funds to the team", `POST /api/companies/{id}/allocate`): **equal split** shares one total equally among every active member (in whole cents; cents that do not divide stay in the company wallet), **chosen employees** pays each selected member the amount entered. Employees then book with their own wallet like any other balance; there is no separate company spending for employees.
  * *Acceptance criteria:* only the company's HR administrator (or a Super Admin) can allocate, and only to active members of that company (not themselves, not suspended accounts, not people outside the company); the company wallet is reduced only if it holds the whole amount, and the company wallet, every recipient's wallet and both ledgers change in **one transaction** (`CompanyWalletTransaction` type `ALLOCATION` per recipient with the running balance, and a `WalletTransaction` `DEPOSIT` "Allocated by <company>" per recipient); a request id makes a repeat harmless (nothing moves twice and nobody is notified twice); two simultaneous requests cannot spend the same money twice; each recipient gets an in-app message "Funds added to your wallet"; the HR administrator sees the latest allocations (`GET /api/companies/{id}/allocate`). Employees never see the company balance (FR-COMP-03).
* **[FR-COMP-05] Team bookings are linked to the named employees:**
  * *Description:* when the HR administrator books for selected team members, the booking carries their identifiers (`attendeeIds` on `DirectBooking` and `HourlyBooking`). The server keeps only real, active members of that HR administrator's own company.
  * *Acceptance criteria:* each named employee sees the booking in their own bookings, gets an in-app message ("Booked for you by your company"), can open its details and QR code, and the check-in is accepted for them; they cannot cancel, change or reschedule it. A person outside the company never appears as an attendee.


### C. Booking Lifecycle
* **[FR-LIFE-01]** Check-in by scanning the QR code, with the entry recorded in `QR_CHECK_INS`.
* **[FR-LIFE-02]** Automatic check-out at the end of the workday, updating the booking to `COMPLETED` and notifying the waitlist.

### D. Financial Operations, Wallets and Refunds
* **[FR-PAY-01]** Mock payment gateway simulation with support for Mada, Visa, MasterCard and Apple Pay cards.
* **[FR-PAY-02]** Partner financial settlements (Payouts) based on confirmed visits. *Status:* the Super Admin records and marks payouts through `POST /api/payouts`; there is no scheduler that creates them automatically on the first day of each month yet.
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
* **[FR-QR-01]** Generate a QR code for each booking. *Status:* the code is a fixed verification link carrying the booking, venue and user identifiers; it does **not** change every 30 seconds. Forgery is limited by the server check that the person has a current booking at that venue (`NO_ACTIVE_BOOKING` otherwise) and that only the owning partner or a Super Admin can record a check-in for someone else. A rotating one-time code (TOTP) is a planned hardening, not built, and no fraud-attempt log exists yet.
* **[FR-QR-02]** A quick check interface for reception staff that confirms a booking's validity in under 500 milliseconds.

### F. Amenities, Tickets and Notifications
* **[FR-FEAT-01]** Manage workspace amenities, with partners able to propose custom amenities that the administration approves.
* **[FR-SUPP-01] Support ticketing system:**
  * *Description:* enable users and companies to create support tickets (`Ticket`) and follow replies (`TicketReply`).
  * *Acceptance criteria:* track the ticket lifecycle through its three states (`OPEN`, `IN_PROGRESS`, `CLOSED`). Replies are saved in `TicketReply` and shown as a conversation in the admin panel, and the admin can reply even to a closed ticket. A ticket carries `message`, `category` (general / complaint / refund / enterprise) and `priority`, and the company is resolved on the server from the requester's record.
  * *Enterprise inquiries:* the `enterprise` category is supported for tailored-offer requests; such a ticket reaches the administrators as an in-app notification (type `SUPPORT_TICKET`) and appears in a separate tab.
* **[FR-SUPP-02] My Tickets (customer side):** every signed-in user except the Super Admin (individuals, company employees, HR administrators and venue partners) has a "My tickets" page (account menu, mobile menu, and the notification "Support replied to your ticket"). It lists the user's own tickets with their status (Pending, In progress, Closed), shows the whole conversation with the support team, lets the user reply, and lets them close their own ticket. A customer cannot reopen a closed ticket or move it along; when the customer replies, the Super Admins get an in-app notification so the conversation does not stall.
* **[FR-NOTIF-01]** In-app notifications for the key events and five transactional emails through Resend. The complete matrix (trigger, sender, recipient, channel and working status of every message) is in **`Notifications_and_Emails.md`**. Summary of what exists today:

| Event | Channel | Recipient | Status |
| :--- | :--- | :--- | :--- |
| Sign-up, sign-in and password-reset codes | Email | User | Random six-digit codes; real delivery needs a verified Resend domain and key, until then the code is printed in the server console |
| New partner application | In-app | Super Admin | Working |
| Partner approved | Email + in-app | Partner | Working (email depends on Resend) |
| Partner rejected with the reason | Email | Partner | Working (email depends on Resend) |
| Booking confirmed (desk, hall, theater) | In-app | Booking owner | Working (no email) |
| Booking cancelled; refund to wallet; pass refunded | In-app | Booking or pass owner | Working (no email) |
| Waitlist joined / promoted | In-app | User | Working |
| Payment recorded | In-app | Payer | Working (payments are simulated until a real gateway is added) |
| New support ticket (including enterprise) | In-app | Super Admin | Working |
| Support reply | In-app | Ticket owner | Working (no email) |
| Team: added, removed, join request, decision | In-app | Employee or HR administrator | Working |
| Booked for you by your company | In-app | Employee | Working |
| Funds added to your wallet (allocated by HR) | In-app | Employee | Working |
| Booking rescheduled | In-app | Owner, attendees, partner, HR administrator | Working (no email) |
| Customer replied on a ticket | In-app | Super Admin | Working |
| New amenity request; amenity decision | In-app | Super Admin; requesting partner | Working (created by the server) |
| Loyalty points earned; checkout finished | In-app (created by the browser) | User | Working |

*Not implemented yet:* booking and purchase confirmation emails, pass-expiry reminder (7 days), payment-failure notice, wallet-deposit notice, partner notice of new bookings, monthly settlement notice, pass-assigned notice, and password-recovery email.


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

* **[FR-SEC-06] Sign-in lockout:** after 5 failed password attempts for the same email within 15 minutes, further sign-in attempts for that email are refused until the window passes. The counter is kept in server memory, so it resets on every restart and is not shared between instances. Rate limiting for verification codes, wallet, booking and ticket routes does not exist yet.

* **[FR-SEC-07] Booking changes only through validated routes:** `PUT /api/direct-bookings/{id}` and `PUT /api/hourly-bookings/{id}` accept a date, room or plan change only from a Super Admin. Everyone else can only cancel (`status: CANCELLED`); a cancelled or refunded booking cannot be reactivated, and an unknown status is rejected. Moving a booking is done with the reschedule endpoints (FR-BOOK-07).
* **[FR-SEC-08] One-time codes:** a code is six random digits (secure generator), stored only as a bcrypt hash, valid for **10 minutes**, usable **once**, and cancelled after **5 wrong guesses** (`OtpCode.attempts`); a new code cancels the earlier ones; sign-in, sign-up and password-reset codes are kept apart by purpose; a new reset code cannot be requested within 30 seconds. There is no shared or master code.


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
  * QR check-in security: accepted only for a current booking at that venue and recorded only by the person themselves, the owning partner or a Super Admin. Rotating time-based codes (TOTP) are planned, not built.
  * OTP protection and hashing, with a validity of at most 10 minutes, single use and five attempts; codes are random and emailed, with no shared test code.
  * Password policy enforced on the server (FR-AUTH-03).
  * **Financial operation integrity:** wallet deductions are atomic and conditional on balance inside database transactions, with idempotency keys and automatic payment rollback when a booking fails.
  * **Server-side validation:** operating hours, fixed sessions, capacity and time overlap are enforced on the server even if the interface bypasses its own restrictions.
* **Performance and responsiveness**
  * Load the workspace list and search in under two seconds.
  * Verify a QR scan in under 500 milliseconds.
  * Deposit instant refund amounts into the digital wallet in under 1 second of processing time.
* **Availability and reliability**
  * The live QA environment runs the frontend and the backend on **Vercel** (deployed from GitHub; the API runs as serverless functions) with a cloud database on **Neon**. Production needs its own Neon database, a Vercel plan that allows commercial use, and shared storage for the security state now kept in memory (see `Production_Checklist.md`).
  * Availability of at least 99.5% per month.
  * Periodic database backups with the ability to restore in emergencies.
* **Localization and UX**
  * The interface works in two languages with full RTL, without horizontal overflow on the main screens on desktop and mobile.
  * Currency, dates and times are displayed according to the language.
* **Quality and maintainability**
  * Every change passes `tsc --noEmit` and `npm run build` in both apps, the Vitest unit tests, the 13 API integration suites and the Playwright suites (`Testing.md`).
  * Integration and browser tests run only against a local database; they never touch shared or production data.
* **Compliance and privacy**
  * Compliance with the Saudi Personal Data Protection Law (PDPL).
  * Documenting and matching the commercial registrations of Saudi partners before enabling any commercial activity on the platform.

---

## 6. Main User Flow
1. **Landing and exploration:** visit the platform and browse spaces and amenities through the application interfaces.
2. **Booking:** choose the required section and room (a shared desk, a meeting room with flexible hours, or a theater).
3. **Payment and wallet:** complete payment by bank card or from the prepaid digital wallet.
4. **Field access:** show the booking's QR code to reception and be verified within seconds.
5. **Flexibility and cancellation:** cancel an eligible booking or package and get the money back instantly in the wallet, or raise a support ticket to follow any inquiry.

---

## 7. Known Gaps Between This Specification and the Current Build

Written after auditing the code on 2026-10-26. Everything above is implemented unless a requirement carries a *Status* note. The items below are specified but missing, simulated or only partly built:

| Area | Gap |
| :--- | :--- |
| Authentication | Until a sending domain is verified in Resend, codes reach only the Resend account owner's mailbox (with no key at all they are printed in the server console). |
| Email | Only five emails exist and real delivery needs a verified Resend domain (`Notifications_and_Emails.md`). They are sent in the recipient's saved language (Arabic or English). |
| Notifications | Missing: booking and pass purchase confirmations, expiry reminder, payment failure, wallet deposit, partner "new booking", settlement notice (`Notifications_and_Emails.md`, section 6). |
| Payments | No real gateway; payments and wallet top-ups are simulated and recorded from the browser (FR-PAY-01). |
| Partner settlements | Payouts are recorded manually by the Super Admin; no monthly scheduler (FR-PAY-02). |
| Waitlist | No 15-minute confirmation window; auto-booking is a browser-only switch (FR-BOOK-04). |
| QR check-in | The QR code is static, not a rotating TOTP code; no fraud log (FR-QR-01). |
| Rescheduling | Built (FR-BOOK-07). Not yet: an email to the owner; repricing a booking covered by a pass (nothing is charged). The interface offers the same room or another room of the venue and type. |
| Company accounts | Department labels are stored only in the HR administrator's browser; passes are not allocated per employee on the server (team bookings are linked to the named employees, FR-COMP-05); an HR administrator can add a member without that person's consent (join requests exist as the consent-based path); the server accepts a company-plan purchase from an employee account (FR-COMP-01 to FR-COMP-05). Company money allocated to a member is kept apart in their wallet: it is spent first, can be capped per month by the HR admin, cannot be cashed out, and whatever is unspent returns to the company wallet when the member is removed. |
| Cancellation window | Based on the booking owner's role (6 hours for `B2C`, including company employees; 24 hours otherwise), not on who paid. |
| Security | In-memory login lockout only; no rate limiting elsewhere; CORS is open to all origins; maintenance routes are protected by Super Admin only (`Production_Checklist.md`). |
| Hosting | The live QA environment is on Vercel with Neon. The logout token list and the sign-in lockout are kept in each serverless instance's memory, so they are not shared between instances. |

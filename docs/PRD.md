# Product Requirements Document (PRD) — Coworking Pass

## 1. Product Vision and Background
Saudi Arabia's labor market is moving quickly toward hybrid and flexible work. Today's coworking market, however, suffers from vendor lock-in: individuals and companies must buy a separate subscription for every brand.

**Coworking Pass** is designed to be the first aggregator and unified network for booking workspaces in Saudi Arabia. Users can either book a specific space directly, or use a **Universal Pass** to move freely between many partner spaces (for example Regus or Zamakan) in different cities with a single subscription.

## 2. Geographic Scope and Payment Methods
* **Target market:** the Kingdom of Saudi Arabia. The initial launch targets Riyadh, Jeddah and Dammam.
* **Payment gateways and wallets:** online payment via Mada, Visa, MasterCard and Apple Pay, plus an internal **Digital Wallet** that supports prepaid top-ups and instant refunds. A mock payment gateway is used in the test environment.

## 3. Problem and Solution
* **Problems**
  - Users are tied to a single workspace location.
  - Companies face high costs when leasing permanent offices or negotiating with several providers.
  - Workspace owners suffer from low occupancy outside peak hours.
* **Solution**
  - One platform with a dual model: direct duration-based bookings and unified Universal Pass memberships. It includes automated billing, a shared corporate wallet for B2B customers, a smart waitlist, an automated refund engine, commercial-registration verification for space partners, and automatic financial settlements.

## 4. Dual Business Model
By management direction, the platform supports two separate operating models:
1. **Model A — Direct booking (duration-based).** Users browse and book a specific workspace for a fixed period.
   * **Allowed durations for shared desks:** daily, monthly and yearly **only**.
   * **Strict rule:** open desks cannot be booked by the hour, to avoid operational chaos for space partners.
2. **Model B — Universal Pass.** Users or companies buy a daily, monthly or yearly membership that grants access to any partner workspace in the network. **To guarantee fair use and prevent phantom seat bookings in several spaces at once, a pass holder may hold a seat in only one specific space at a time. They can later cancel and move to another space for free.**

## 5. User Personas
1. **Guest:** browses the site to explore spaces, amenities and prices without creating an account.
2. **Individual member (B2C):** a freelancer or remote employee who books spaces directly or buys the Universal Pass, manages a digital wallet and loyalty points, and opens support tickets when needed.
3. **HR administrator (B2B):** represents a company. Has a dashboard to manage the shared company balance (`Company.balance`), distribute memberships to employees and monitor consumption.
4. **Workspace partner:** the owner or manager of a workspace. Registration requires a Saudi commercial registration number (CR / `taxNumber`), and the account stays `PENDING_APPROVAL` until the administration approves it. Uses a dedicated portal to manage venues and rooms, track visitors, scan QR codes, and propose amenities and loyalty rules.
5. **Super Admin:** the platform owner. Approves new partners and verifies their commercial registrations, resolves tickets and disputes, suspends and reinstates users (`isBanned`), and runs the automated monthly financial settlements.

## 6. Key Performance Indicators (KPIs)
* Onboard 50 partner brands in 10 cities in the first quarter, each with a verified commercial registration.
* Reach 10,000 successful QR check-ins in the first 6 months.
* Convert 40% of waitlist users into paid, confirmed bookings.
* Sign B2B contracts with 20 large companies and activate their shared wallets.
* Reach a loyalty redemption rate of at least 25% of earned points within the first year.
* Bring the time to refund into a digital wallet to 0 minutes.

## 7. Bookable Workspace Structure

### 7.0 Hub → Rooms / Sections Hierarchy
A venue is not treated as a single entity. A physical building may contain desks, meeting rooms and theaters with different capacities and prices, so a workspace is modeled as a two-level hierarchy:

| Level | Content |
| :--- | :--- |
| **Hub (Workspace)** | General building details: name, city, address, photos, general amenities, operating hours, visibility. |
| **Rooms / Sections** | Belong to the hub. Each has a name (for example Meeting Hall A, VIP Theater, Dedicated Desks), a type (meeting room, training hall, event hall, theater, dedicated desk, private office, hot desk), a seating capacity, and its own rates (hourly, daily, monthly, yearly). |

* **Partner workflow:** the partner (or an admin) adds rooms with the **"+ Add Room / Section"** button in the "Facilities & Sections" block of the add/edit workspace form. Empty rates in a room fall back to the hub's rates. A hub without rooms is booked as a single space, as before.
* **Customer experience:** on the details page and in the booking flow the customer selects a room. The available plans, price, capacity and session grid all update to the selected room (an hourly hall, or a desk with daily, monthly or yearly plans).
* **Booking link:** every booking (direct or hourly) links directly to the selected room through `sectionId`, and capacity and availability are calculated per room.
* **Mixed cart:** one checkout can combine an hourly hall, a theater and a daily office. Each item is saved according to its own plan, not the hub's default mode.

Each room belongs to one of **two** categories that are unified in software and operations, each with its own booking model:

### A. Shared Desks / Hot Desks
Open work seats in the shared area, available to individuals and teams.
* **Booking model:** daily, monthly or yearly **only** (no hourly booking).
* **Supports:** direct booking, the Universal Pass, and the waitlist.

### B. Meeting Rooms and Theaters / Auditoriums (one unified category)
Rooms and halls equipped with display screens, meeting equipment, presentation stages and advanced audio-visual systems for meetings, presentations, events and workshops.
* **Booking model:** unified flexible hour packages (hours per day or hours per month).
* **How it works and how it integrates with the Universal Pass:**
  - **Covered by a unified hours credit (Meeting Room & Theater Credits):** meeting rooms and theaters share the same category and the same hours credit that comes with monthly and yearly passes (the monthly pass includes 8 hours per month, the yearly pass 12 hours per month, and corporate passes from 10 hours per month up to unlimited-booking plans*). A pass holder can spend their hours in either meeting rooms or theaters, on equal terms.
  - **Unlimited-booking plans and Fair Use Policy:** to prevent abuse and hoarding (for example a company making thousands of arbitrary bookings), the plan is displayed as **"Unlimited*"** in line with the marketing offer, but is technically and contractually limited by the fair-use rule of **at most 5 bookings per week** per active user or employee.
  - **Direct, standalone hourly or event booking:** individuals, companies and event organizers who do not hold a Universal Pass can book by the hour (for example visitors attending a meeting, or organizers renting a theater), as can pass holders who have used up their hours and wish to buy more.
  - **Unified loyalty points:** meeting rooms and theaters follow the same loyalty earning formula and redemption rate for direct payment or hourly package consumption, as they are the same software and operational category.
  - **Fixed sessions and operating hours:** halls and theaters are booked in **fixed 2-hour sessions** (with a 1-hour turnaround between sessions) inside the venue's operating hours (`openingTime` to `closingTime`), and each session must end by **10:00 PM**. The system rejects any time outside operating hours or any duration other than two hours.
  - **Availability per session and per room:** capacity, availability and the available/busy indicator are evaluated **for the selected session and the selected room**, not for the whole day. A room booked from 11:00 to 13:00 does not make the day full; the 14:00–16:00 session stays available at full capacity (for example 15/15). Booked sessions are shown disabled, and the number of seats cannot exceed the room's capacity.

### Authentication and Account Verification
* **Phone verification and international country-code picker**
  - **Drop-down list plus a standard library:** the best-practice solution is adopted — a country-code picker combined with a standard phone-number library — instead of a fixed Saudi regular expression.
  - **Default country:** Saudi Arabia (`+966`) with the 🇸🇦 flag, to ease the experience for the largest user segment.
  - **Global support:** the user can switch to any country (for example UAE `+971`, Egypt `+20`, UK `+44`, USA `+1`).
  - **Standard validation:** dynamic checks against international rules (for example `libphonenumber-js`, E.164 format) for the number of digits and the structure of each country's numbers.
* **Email verification (OTP)**
  - **At sign-up:** a temporary one-time code is emailed (through Resend) to confirm ownership before the account is activated.
  - **At password recovery and login:** sessions are protected and identity is confirmed with time-limited encrypted codes.

## 8. Amenities Management
A smart system for managing the services and facilities available in each workspace:
1. **Platform default amenities:** a pre-approved base list (fast internet, free coffee, printer, cleaning service, parking, and so on).
2. **Partner customization:** the partner admin selects the amenities available in their space so that they appear to customers.
3. **Proposing custom amenities**
   - A partner can propose a new amenity through their portal.
   - The request goes to the **Super Admin** for review.
   - **Decision:** accept (the amenity joins the official dictionary for all partners) or reject.

## 9. Loyalty Points Program
A loyalty program that encourages customers to keep using the platform, managed centrally by the Super Admin:
* **Earning:** automatic points with every successful payment.
* **Redemption:** exchange points for free bookings or cash discounts.
* **Rule management:** partners can propose custom point rules, which the Super Admin reviews and approves.

## 10. Corporate Accounts (B2B — Team Pass)
* **Shared corporate wallet:** a central, unified company balance (`Company.balance`) that the HR administrator tops up.
* **Employee management:** add employees and assign visit packages, or let them draw on the company balance directly.
* **Flexible consumption and fair use:** an employee books the space closest to them and the booking is deducted automatically from the company wallet with no per-person invoicing. Corporate plans that appear as "Unlimited*" are subject to the strict fair-use rule of **at most 5 bookings per week per employee**, to protect capacity and prevent exhausting partner resources.
* **Corporate plan scope:** corporate plans are limited to the standard **Team Pass** and **Business Pass** to keep the purchase journey simple. The **"Custom Enterprise" card was removed** from the plans page. The organization navigation no longer includes a "Company Workspaces" page, which was removed because B2B accounts do not need it.

## 11. Advanced UX and Filtering
1. **Smart multi-filtering:** quick filters that combine price, type and required amenities.
2. **Capacity bar:** a smart color indicator (green = available, yellow = moderate, red = busy) based on real-time bookings.
3. **Proximity geo-sorting:** the distance is computed in software with the Haversine formula and shown in kilometers next to the price.

## 12. Digital Wallets and Corporate Balance
* **Individual digital wallet (B2C)**
  - Lets the customer deposit money in advance.
  - One-click payment from the wallet balance without re-entering card details.
  - Receives refunds for cancelled bookings and passes instantly (Instant Refund), removing long bank waiting periods.
* **Unified corporate wallet (B2B)**
  - A central balance per company for booking desks and halls for its employees.
  - A detailed financial ledger for each wallet — `WALLET_TRANSACTIONS` for individuals and `COMPANY_WALLET_TRANSACTIONS` for the shared wallet — provides transparency and tracks every halala, with the balance after each movement.
  - **Deduction integrity:** deductions are atomic and conditional on sufficient balance, so the balance can never be exceeded. Each payment carries an idempotency key that prevents duplicate deductions on repeated clicks or retries.
  - **Automatic cart rollback:** if money was deducted from a wallet and the server then rejects one of the bookings (for example a room that another customer has just booked), that booking's share of the amount is returned to the same wallet (personal or corporate) automatically, with a clear message to the customer, without affecting the other successful bookings.

## 13. Customer Support Ticketing System
* An integrated system for tracking complaints and inquiries from individuals and companies inside the platform.
* The ticket lifecycle uses standard states:
  - **Open (`OPEN`):** a new ticket awaiting a response from the support team.
  - **In progress (`IN_PROGRESS`):** coordination with the partner or the administration is under way.
  - **Closed (`CLOSED`):** the problem was solved and the closure confirmed.
* An interactive message thread (`TicketReply`) connects the customer and the administrators inside the context of the ticket. Replies saved in the database are shown as a conversation in the admin panel, and the customer receives a notification when support replies.
* **Enterprise inquiries:** the ticket system supports an `enterprise` category for tailored-offer requests from large companies. These reach the administrators as a notification and have their own tab. (The dedicated Custom Enterprise plan card was removed from the plans page, so such requests now come through normal support channels.)

## 14. Automated Cancellation and Refund Engine (Direct Bookings vs Packages)
The refund engine supports precise policies that separate direct bookings tied to specific seats and dates from membership and hour packages. Refunds are processed in a single database transaction with an idempotency key, so a booking or pass can never be refunded twice, and an official `REFUND` entry is recorded in `PAYMENTS` and in the ledger of the relevant wallet (personal, or the shared wallet for corporate accounts).

* **1. Direct bookings and meeting rooms**
  - They are tied to specific seats and times and affect the waitlist and branch availability:
    - **Individual (B2C) shared-desk bookings:** free cancellation with a full refund at least **6 hours** before the booking start time.
    - **Corporate (B2B) bookings and meeting-room and theater bookings:** free cancellation at least **24 hours** in advance, so the partner can release the seat or hall to others.
* **2. Universal Pass subscriptions**
  - They are not tied to a specific seat but grant an access credit across the partner network:
    - **Grace period (3 days):** the user or company can get a full refund of the pass within **3 days (72 hours)** of purchase, provided **no visit has been used (`visitsUsed == 0`)** and there is no active seat booking.
    - **After any visit is used (`visitsUsed > 0`) or after 3 days:** the automatic refund right lapses; it is considered only through support tickets and the Super Admin for documented failures.
* **3. Hourly packages**
  - When a meeting-room or theater session is cancelled within the cancellation window (6 hours for individuals, 24 hours for companies), the unused hours are automatically returned to the customer's package credit.
  - If a monetary refund of a purchased hour package is requested, a full refund is available within 3 days of purchase as long as no hour has been used.
* **4. Refund payout options**
  - **Instant wallet refund:** the refund amount is added to the digital wallet immediately (0 minutes, no fees).
  - **Refund to the bank card:** processed through the payment gateway to the original card (5–14 business days).

## 15. Open API Documentation (OpenAPI / Swagger)
* An interactive documentation page for developers and technical partners at `/api-doc`.
* Built to the **OpenAPI 3.0** specification with live testing tools (Swagger UI).
* Covers all platform routes: authentication, bookings, wallet, tickets, QR scanning and amenities.

## 16. Internationalization and RTL
* **Dual-language engine:** the whole interface is available in 🇸🇦 Arabic (the default) and 🇬🇧 English, with a language switcher in the top bar next to the user's avatar. The user's choice is stored in the browser and applied from the first paint without a flash.
* **Page direction:** in Arabic the page is set to `lang="ar" dir="rtl"`, layouts, spacing and directional icons flip automatically, and **Tajawal** is used for Arabic text.
* **Static text:** comes from hand-written translation dictionaries (`ar` / `en`) with a strict type, so the build fails if any key is missing in either language.
* **Dynamic content (workspaces):** entered by the partner or admin in both languages in the workspace form (name, description, address, city) and stored in the database (`nameAr`, `descriptionAr`, `addressAr`, `cityAr`). It is **never machine-translated**. When the Arabic version is missing, the English text is shown as a graceful fallback.
* **System messages:** common notifications and error messages are translated centrally; a message that is not registered appears in English.
* **Dates and times:** displayed according to the current language.

## 17. Security and Governance
* **Role-based access control (RBAC) and ownership scope**
  - **Payouts and statistics:** the Super Admin sees and creates everything, a partner sees only their own payouts, and platform-wide financial statistics are for the Super Admin only.
  - **Rooms and sections:** create, edit and delete are limited to the owning partner or the Super Admin, and only specific fields are accepted on edit.
  - **Booking lists:** a user sees their own bookings, a partner sees the bookings of their own spaces only, an HR administrator sees their team's bookings, and the Super Admin sees all.
* **Permanent account suspension:** a suspension is stored in the database and survives server restarts. A suspended account receives `HTTP 403` with the code `ACCOUNT_SUSPENDED`, and the user sees a **non-dismissible** suspension modal that blocks further use.
* **Cascading deletion:** deleting a user, partner or workspace removes dependent data in the correct order while preserving foreign-key integrity.
* **Hidden spaces:** a hidden space is neither shown nor bookable for anyone except the Super Admin and its owner, enforced on the server and not only in the interface.
* **Session lifetime:** the login token (JWT) is valid for 24 hours and is revoked on logout.

## 18. Scope Simplifications
* The **"Company Workspaces"** page and its link were removed from B2B navigation.
* The **"Custom Enterprise"** card was removed from the corporate plans page; the offer relies on Team Pass and Business Pass.

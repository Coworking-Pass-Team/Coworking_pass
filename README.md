<div align="center">

# Coworking Pass 🇸🇦

**One pass. Every workspace in the Kingdom.**
A bilingual (Arabic / English) B2B2C platform that aggregates flexible workspaces across Saudi Arabia, so individuals and companies book any partner venue with a single account, wallet and pass.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![Render](https://img.shields.io/badge/Hosted_on-Render-46E3B7?logo=render&logoColor=black)](https://render.com)

</div>

---

## Table of Contents
1. [Overview](#overview)
2. [Core Pillars & User Ecosystem](#core-pillars--user-ecosystem)
3. [Bilingual & RTL Architecture](#bilingual--rtl-architecture)
4. [Key Engineering Features](#key-engineering-features)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Local Development](#local-development)
8. [Quality Checks](#quality-checks)
9. [Documentation](#documentation)

---

## Overview
Saudi Arabia's coworking market is fragmented: every brand sells its own subscription, so freelancers and companies end up locked into a single venue or juggling several contracts, while venue owners struggle with low off-peak occupancy.

**Coworking Pass** is an aggregator that removes this friction. Customers can either **book a specific room directly** (by the hour, day, month or year) or hold a **Universal Pass** that works across the whole partner network. Companies fund a **corporate wallet**: the HR administrator books for the team from it and can allocate money into employees' own wallets. Partners list their venues and rooms, get paid automatically, and the platform team governs quality, money movement and support from one admin portal.

## Core Pillars & User Ecosystem

| Portal | Who it serves | Highlights |
| :--- | :--- | :--- |
| **Individuals (B2C)** | Freelancers, students, remote employees | Flexible hourly / daily / monthly / annual passes, real-time seat availability, QR check-in passes, a personal digital wallet with instant refunds, one free reschedule per booking, loyalty rewards, waitlist with auto-booking, and a "My tickets" support inbox. |
| **Organizations (B2B)** | Companies and HR administrators | Enterprise HR portal, team join requests and approvals, bookings made for team members (who see them with a QR code), Team Pass and Business Pass plans, and a **corporate wallet** with atomic, idempotent deductions, a full ledger and **fund allocation** to employees (equal split or chosen amounts). Employees never see the company balance. |
| **Space Partners** | Venue owners and managers | Venue management with **multi-room and section inventory** (meeting halls, theaters, offices with independent capacities, rates and session grids), bilingual profiles, operating hours, visibility control, loyalty proposals and revenue analytics. |
| **Super Admin** | Platform team | Governance and moderation, live aggregations (revenue, bookings, users), partner and amenity approvals, hidden-space toggles, refunds, payouts and support-ticket resolution. |

## Bilingual & RTL Architecture
- **Native Arabic (RTL) and English (LTR)** with a language switcher in the top bar. Arabic is the default and uses **Tajawal** typography; layout, spacing and directional icons flip automatically.
- **SSR language persistence:** the language is stored in a cookie (mirrored in `localStorage`), so the server renders `<html lang dir>` correctly on the first paint with no flash.
- **Strictly typed dictionaries:** `frontend/i18n/ar.json` and `en.json` share one key type; the build fails if a key is missing in either language.
- **Bilingual database schema:** workspace content is authored by partners and admins in both languages (`name` / `nameAr`, `description` / `descriptionAr`, `address` / `addressAr`, `city` / `cityAr`), never machine-translated, with a graceful English fallback.

## Key Engineering Features
- **Hub → Rooms model:** a workspace (hub) contains rooms/sections, each with its own type, capacity and hourly / daily / monthly / yearly rates. Bookings link directly to the chosen `sectionId`.
- **Slot-based availability:** halls and theaters are booked in fixed 2-hour sessions inside the venue's operating hours. Capacity and "busy" state are evaluated per session and per room, never locking a whole day.
- **Financial integrity:** atomic conditional wallet debits, idempotency keys, a company wallet ledger (`CompanyWalletTransaction`, including `ALLOCATION` rows), automatic refund rollback when a cart booking fails, and a 72-hour Universal Pass refund policy.
- **Validated rescheduling:** a booking can be moved once for free, at least 6 hours (hourly sessions) or 24 hours (desk passes) before it starts and up to 30 days ahead; capacity is re-checked and any price difference is settled on the wallet that paid.
- **Sign-in security:** every sign-in and sign-up is confirmed with a random 6-digit code emailed through Resend (10 minutes, single use, five attempts); passwords must meet a policy (8+ characters, upper and lower case, a number, a special character, no sequences like `123` or `abc`) shown as a live checklist; password recovery by emailed code.
- **Security and governance:** role-based access with ownership scoping (payouts, rooms, booking lists), permanent database-backed account suspension (`HTTP 403 ACCOUNT_SUSPENDED` with a non-dismissible modal), cascading deletes and server-enforced hidden spaces.
- **Support:** ticketing with threaded replies persisted in the database and admin notifications.
- **Open API docs:** interactive Swagger UI served by the backend at `/api-doc`.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Lucide icons, `next/font` (Tajawal) |
| **Backend API** | Next.js Route Handlers (`backend/app/api/**`), TypeScript, Node.js, OpenAPI via Swagger UI |
| **Database** | PostgreSQL on **Neon**, accessed with **Prisma ORM 6** (migrations plus an idempotent startup schema sync) |
| **Authentication** | JWT (24 h) with a logout blacklist, bcrypt password hashing, email OTP, and a database session check (ban / approval status) on every request |
| **Email** | Resend |
| **Testing** | Vitest unit tests and 13 API integration suites (`backend/tests`), Playwright browser suites (`frontend/tests`) |
| **Hosting** | Render (frontend and backend web services) |

## Project Structure
```text
Coworking_pass/
├── frontend/                   # Next.js web application (port 3000)
│   ├── app/                    #   routes (page.tsx) and the screens of the single-page app
│   │   ├── individual/  organization/  provider/  admin/  support/  Auth/  spaces/ ...
│   │   ├── app.tsx             #   screen switcher        store.tsx   app state and API calls
│   ├── components/             #   shared React components, grouped by feature
│   │   ├── auth/  bookings/  company/  landing/  layout/  spaces/  wallet/
│   │   └── ui/                 #   primitives: Button, Input, Select, Modal, Badge, UserAvatar
│   ├── hooks/                  #   reusable React hooks
│   ├── lib/                    #   pure helpers (booking lifecycle, plan coverage, password policy)
│   ├── services/api.ts         #   typed client for the backend API
│   ├── types/                  #   domain types and booking / pricing helpers
│   ├── i18n/                   #   ar.json, en.json, provider, server-message registry
│   ├── data/demo-data.ts       #   demo venues shown when the API is unreachable
│   └── tests/                  #   Playwright specs, helpers/, tools/
├── backend/                    # REST API (port 3001)
│   ├── app/api/                #   route handlers (auth, workspaces, bookings, companies, wallets, tickets, ...)
│   ├── lib/                    #   server logic, grouped by domain
│   │   ├── auth/               #     JWT checks, logout blacklist, one-time codes, password policy, super admin, login lockout
│   │   ├── booking/            #     capacity, lifecycle, rescheduling
│   │   ├── company/            #     fund allocation, join requests, team
│   │   ├── workspaces/         #     space types, operating hours, visibility, distance
│   │   ├── db/                 #     schema sync, seed data, Arabic backfill, cascading deletes
│   │   ├── swagger/            #     OpenAPI config
│   │   └── prisma.ts  mailer.ts  wallet.ts  ownership.ts  errors.ts  bilingual.ts  time-utils.ts
│   ├── prisma/                 #   schema.prisma and SQL migrations
│   ├── scripts/                #   seed-accounts.mjs, local PostgreSQL helpers
│   └── tests/                  #   Vitest unit tests and api-qa/ integration suites
└── docs/                       # all documentation (English); docs/ar/ holds the Arabic copies
    └── testing/                #   archived QA audit reports
```

## Local Development

### Prerequisites
- Node.js 20+ and npm
- A PostgreSQL database (a free [Neon](https://neon.tech) project works; use a **development** database, not production)

### 1. Clone
```bash
git clone https://github.com/Coworking-Pass-Team/Coworking_pass.git
cd Coworking_pass
git checkout develop
```

### 2. Configure environment variables
Copy the examples and fill in real values (the `.env` files are git-ignored).
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

| Variable | Where | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | Secret used to sign login tokens |
| `RESEND_API_KEY` | backend | Email delivery. Optional locally: without it, one-time codes are printed in the backend console |
| `RESEND_FROM_EMAIL` | backend | Sender address, e.g. `Coworking Pass <no-reply@yourdomain.com>` (defaults to Resend's test sender) |
| `NEXT_PUBLIC_API_URL` | frontend | Backend base URL. When unset, the frontend uses the live Render API (`https://coworking-pass-k49w.onrender.com`); set it to `http://localhost:3001` to use a local backend |

### 3. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Sync the database
```bash
cd backend
npx prisma generate
npx prisma db push          # or apply the SQL files in prisma/migrations
```
The backend also runs an idempotent schema sync at startup (`instrumentation.ts`), and `GET /api/db-sync` can be called by an admin after a deployment that adds columns.

To create the team accounts (one per role, see [docs/Accounts.md](docs/Accounts.md)), put the private
`backend/scripts/team-accounts.json` in place (shape in `team-accounts.example.json`) and run `npm run seed:accounts`.

### 5. Run both services
```bash
# Terminal 1 - API on http://localhost:3001 (docs at /api-doc)
cd backend && npm run dev

# Terminal 2 - web app on http://localhost:3000
cd frontend && npm run dev
```

## Quality Checks
Run these before opening a pull request:
```bash
# both apps
npx tsc --noEmit
npm run build
npm run lint

# backend
npm test                 # Vitest unit tests
npm run test:api         # the 13 API suites (local backend on 3001 and its local database)

# frontend (frontend and backend running locally)
npm run test:e2e         # Playwright
```
The API and browser suites write known one-time codes into the **local** database, so never point them at a shared
or production environment. Details in [docs/Testing.md](docs/Testing.md).

## Documentation
Every document has an Arabic copy under `docs/ar/` (kept locally). The index is [docs/README.md](docs/README.md).

| Document | Description |
| :--- | :--- |
| [Product Requirements (PRD)](docs/PRD.md) | Vision, personas, business model, product rules |
| [Software Requirements (SRS)](docs/SRS.md) | Roles, user stories, functional requirements with IDs and acceptance criteria |
| [Database Design (ERD)](docs/ERD.md) | Entity-relationship diagram, tables and integrity rules |
| [System Architecture](docs/System_Architecture.md) | Stack, flows, i18n and security architecture, recommendations |
| [Notifications and Emails](docs/Notifications_and_Emails.md) | Every in-app notification and email: trigger, recipient, status |
| [Testing](docs/Testing.md) | Test layers, how to run them, and the archived QA reports |
| [Team Accounts](docs/Accounts.md) | The seeded account per role and the password policy |
| [Production Checklist](docs/Production_Checklist.md) | What must be done before the public launch |
| [Financial Model](docs/Financial_Model.md) | Revenue streams, payouts, wallet economics |
| [Legal Policies](docs/Legal_Policies.md) | Terms of service and privacy policy drafts |
| [Partner SLA](docs/Partner_SLA.md) | Partner obligations and settlement terms |
| [Support Workflow](docs/Support_Workflow.md) | Ticket lifecycle and standard operating procedures |
| [Final Report (Word)](docs/Coworking_Pass_Final_Report_EN.docx) | The submitted project report (a snapshot; it is not regenerated from these files) |

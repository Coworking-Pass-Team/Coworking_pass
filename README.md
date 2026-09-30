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

**Coworking Pass** is an aggregator that removes this friction. Customers can either **book a specific room directly** (by the hour, day, month or year) or hold a **Universal Pass** that works across the whole partner network. Companies fund a **shared corporate wallet** and let their employees book without individual invoices. Partners list their venues and rooms, get paid automatically, and the platform team governs quality, money movement and support from one admin portal.

## Core Pillars & User Ecosystem

| Portal | Who it serves | Highlights |
| :--- | :--- | :--- |
| **Individuals (B2C)** | Freelancers, students, remote employees | Flexible hourly / daily / monthly / annual passes, real-time seat availability, dynamic QR check-in passes, a personal digital wallet with instant refunds, loyalty rewards, waitlist with auto-booking. |
| **Organizations (B2B)** | Companies and HR administrators | Enterprise HR portal, team seat allocation, Team Pass and Business Pass plans, and a **Corporate Shared Wallet** with atomic, idempotent deductions and a full ledger. |
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
- **Financial integrity:** atomic conditional wallet debits, idempotency keys, a company wallet ledger (`CompanyWalletTransaction`), automatic refund rollback when a cart booking fails, and a 72-hour Universal Pass refund policy.
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
| **Testing** | Playwright end-to-end suites (`frontend/tests`) |
| **Hosting** | Render (frontend and backend web services) |

## Project Structure
```text
Coworking_pass/
├── frontend/                 # Next.js web application (port 3000)
│   ├── app/                  #   screens: individual/, organization/, provider/, admin/, spaces/, ...
│   ├── components/           #   shared UI: layout, spaces, landing, modals
│   ├── i18n/                 #   ar.json, en.json, provider, message registry, helpers
│   ├── services/             #   API client (authApi.ts)
│   ├── types/                #   domain types and booking/pricing helpers
│   └── tests/                #   Playwright specs
├── backend/                  # REST API (port 3001)
│   ├── app/api/              #   route handlers (auth, workspaces, bookings, wallets, tickets, ...)
│   ├── lib/                  #   auth, ownership, capacity, operating hours, wallet, schema sync
│   ├── prisma/               #   schema.prisma and SQL migrations
│   └── scripts/              #   local database helpers
├── docs/                     # English documentation (PRD, SRS, ERD, architecture, policies)
└── testing/                  # QA audit reports and the backend API test suite
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
| `RESEND_API_KEY` | backend | Email delivery (optional locally) |
| `NEXT_PUBLIC_API_URL` | frontend | Backend base URL (defaults to `http://localhost:3001`) |

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

### 5. Run both services
```bash
# Terminal 1 - API on http://localhost:3001 (docs at /api-doc)
cd backend && npm run dev

# Terminal 2 - web app on http://localhost:3000
cd frontend && npm run dev
```

## Quality Checks
Run these in both `frontend/` and `backend/` before opening a pull request:
```bash
npx tsc --noEmit
npm run build
npm run lint
```
End-to-end tests (frontend must be running): `cd frontend && npx playwright test`.

## Documentation

| Document | Description |
| :--- | :--- |
| [Product Requirements (PRD)](docs/PRD.md) | Vision, personas, business model, product rules |
| [Software Requirements (SRS)](docs/SRS.md) | Roles, user stories, functional requirements with IDs and acceptance criteria |
| [Database Design (ERD)](docs/ERD.md) | Entity-relationship diagram, tables and integrity rules |
| [System Architecture](docs/System_Architecture.md) | Stack, flows, i18n and security architecture, recommendations |
| [Financial Model](docs/Financial_Model.md) | Revenue streams, payouts, wallet economics |
| [Legal Policies](docs/Legal_Policies.md) | Terms of service and privacy policy drafts |
| [Partner SLA](docs/Partner_SLA.md) | Partner obligations and settlement terms |
| [Support Workflow](docs/Support_Workflow.md) | Ticket lifecycle and standard operating procedures |
| [Final Report (Word)](docs/Coworking_Pass_Final_Report_EN.docx) | All chapters compiled into one document |

To rebuild the Word report: `python docs/build_report.py`.

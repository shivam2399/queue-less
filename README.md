# QueueLess — Smart Appointment & Queue Management SaaS

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24%20%7C%2018%2B-green?style=flat&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?style=flat&logo=express)](https://expressjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6-blue?style=flat&logo=sequelize)](https://sequelize.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-white?style=flat&logo=socket.io)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

> **Book ahead. Know your place. Skip the uncertainty.**  
> A lightweight appointment and walk-in queue management platform designed for local service businesses like clinics, salons, repair centers, and specialist shops.

---

## 1. Overview & Architecture

QueueLess solves physical waiting room crowding and operational chaos. Customers book services, receive an authoritative digital token, and track the live queue from any browser. Business owners operate a responsive live dashboard to call next customers, complete appointments, and manage daily service offerings.

```
                      ┌──────────────────────────────────────┐
                      │   Next.js 15 App Router Frontend    │
                      │  (Tailwind CSS + Premium Dark SaaS)  │
                      └──────────────────┬───────────────────┘
                                         │ REST API / Cookie Session / Socket.IO
                                         ▼
                      ┌──────────────────────────────────────┐
                      │      Node.js + Express 4 Backend     │
                      │   (Modular Monolith under /api/v1)   │
                      └──────────┬───────────────────┬───────┘
                                 │                   │
                  Sequelize ORM  │                   │ Socket.IO Notifications
                                 ▼                   ▼
                      ┌──────────────────┐    ┌──────────────────────┐
                      │     MySQL 8      │    │  Public & Owner Live │
                      │ (InnoDB + Locks) │    │     Room Updates     │
                      └──────────────────┘    └──────────────────────┘
```

### Core Architecture Principles
1. **Source of Truth**: MySQL 8 / InnoDB is authoritative. Socket.IO is strictly an event notification delivery mechanism.
2. **Transactional Concurrency**: Token allocation locks the daily queue counter row (`SELECT ... FOR UPDATE`) in a database transaction, guaranteeing strictly unique, sequential token numbers without race collisions.
3. **State Machine Integrity**: Strict single-serving enforcement per business/day. Allowed transitions: `waiting` → `serving` → `completed` / `no_show` / `cancelled`. Cancelled tokens are never recycled.
4. **Security & Privacy**:
   - Authentication via HttpOnly, Secure session cookies (JWT) with exact CORS origin matching.
   - CSRF protection via Double-Submit Cookie pattern for state-changing endpoints.
   - Role-Based Access Control (`customer` vs `business_owner`) with strict server-side ownership scoping (`owner_id = req.user.id`).
   - Zero customer PII is ever leaked in public queue displays or broadcast events.

---

## 2. Deterministic Demo Accounts

Pre-configured synthetic accounts are available for instant testing:

| Role | Email | Password | Pre-seeded Resources |
|---|---|---|---|
| **Business Owner** | `owner@queueless.com` | `Password123!` | Owns *City Care Clinic* and *Luxe Salon & Spa* |
| **Customer** | `customer@queueless.com` | `Password123!` | Pre-booked visit tokens |

---

## 3. Local Setup & Quick Start

### Prerequisites
- Node.js `>= 18.0.0` (tested on Node 20 & Node 24)
- npm `>= 9.0.0`
- MySQL 8 (or uses built-in in-memory SQLite automatically during unit tests)

### Step 1: Clone & Configure

```bash
git clone <YOUR_REPO_URL>
cd queue-less
```

### Step 2: Configure Backend Environment

```bash
cd server
cp .env.example .env
npm install
```

Configure `server/.env`:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=queueless
DB_USER=root
DB_PASSWORD=
DB_DIALECT=mysql
JWT_SECRET=queueless_super_secret_jwt_key_development_32chars
JWT_EXPIRES_IN=1d
CSRF_SECRET=queueless_super_secret_csrf_key_dev_32chars
```

Run seed script (optional for demo data):
```bash
npm run db:seed
```

Start backend API:
```bash
npm run dev
# Server will run on http://localhost:5000
# Health check: http://localhost:5000/health
# Readiness check: http://localhost:5000/ready
```

### Step 3: Configure Frontend Environment

In a separate terminal:

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
# Frontend will run on http://localhost:3000
```

---

## 4. Automated Testing Suite

The repository contains an exhaustive test suite covering Authentication, Cross-Owner Authorization, Service Deactivation, Concurrency & Row Locking, and Queue State Transitions.

```bash
cd server
npm test
```

### Current Test Results:
- **Test Suites**: `3 passed, 3 total`
- **Tests**: `36 passed, 36 total`
  - `auth.test.js`: 12/12 passed (registration, login, invalid credentials, public admin rejection, inactive user rejection, cookie clearing)
  - `business-service.test.js`: 9/9 passed (business profile creation, cross-owner update denial, public search/pagination, service duration/price validation, cross-owner service isolation, soft-deletion)
  - `appointment-queue.test.js`: 15/15 passed (Token 1 allocation, sequential increment, independent business queues, token non-reuse after cancellation, concurrent bookings uniqueness, call-next, single serving conflict 409, complete-current, skipping cancelled tokens, no-show, paused queue blocking, public queue PII privacy)

---

## 5. API Reference Summary (`/api/v1`)

### Authentication
- `POST /api/v1/auth/register` — Register customer or business owner
- `POST /api/v1/auth/login` — Set HttpOnly session cookie
- `POST /api/v1/auth/logout` — Clear session cookie
- `GET /api/v1/auth/me` — Safe authenticated user profile
- `GET /api/v1/auth/csrf` — Retrieve CSRF token

### Businesses
- `GET /api/v1/businesses` — Public paginated directory with search
- `GET /api/v1/businesses/mine` — Businesses owned by logged-in owner
- `GET /api/v1/businesses/:id` — Public details and active services
- `POST /api/v1/businesses` — Create business profile (Owner only)
- `PATCH /api/v1/businesses/:id` — Update business profile (Owner only)

### Services
- `GET /api/v1/businesses/:id/services` — Public active services
- `POST /api/v1/businesses/:id/services` — Add service (Owner only)
- `PATCH /api/v1/services/:id` — Edit service (Owner only)
- `DELETE /api/v1/services/:id` — Soft-deactivate service (Owner only)

### Appointments
- `POST /api/v1/appointments` — Transactional booking & token allocation (Customer only)
- `GET /api/v1/appointments/mine` — Customer appointments list
- `GET /api/v1/businesses/:id/appointments` — Business appointments for date (Owner only)
- `GET /api/v1/appointments/:id` — Appointment details (Customer or Owner)
- `PATCH /api/v1/appointments/:id/cancel` — Cancel waiting appointment

### Queue Engine
- `GET /api/v1/businesses/:id/queue` — Public real-time snapshot (NO PII)
- `POST /api/v1/businesses/:id/queue/call-next` — Transactionally call next waiting token
- `POST /api/v1/businesses/:id/queue/complete-current` — Mark current appointment completed
- `POST /api/v1/businesses/:id/queue/appointments/:id/no-show` — Mark appointment as no-show
- `PATCH /api/v1/businesses/:id/queue/pause` — Pause or resume daily queue

---

## 6. Deployment Guide

### Backend: Railway Deployment
1. Create a new Railway project and add a **MySQL** database.
2. Add a new service from GitHub pointing to `/server`.
3. Set environment variables in Railway:
   - `PORT`: (Auto-provided by Railway)
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `DB_HOST`: Railway private MySQL host
   - `DB_PORT`: Railway MySQL port
   - `DB_NAME`: Railway database name
   - `DB_USER`: Railway database user
   - `DB_PASSWORD`: Railway database password
   - `JWT_SECRET`: Random 32+ character string
   - `JWT_EXPIRES_IN`: `1d`
4. The service will automatically build via `NIXPACKS` and run `npm start` (`node src/server.js`), monitoring `/health`.

### Frontend: Vercel Deployment
1. Import repository in Vercel.
2. Set **Root Directory** to `client`.
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.up.railway.app/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL`: `https://your-backend.up.railway.app`
4. Deploy! Vercel builds all 11 static/dynamic pages with automatic optimization.

---

## 7. Known Limitations (Disclosed)
- Single shared daily queue per business location in MVP (no multi-station or employee calendars).
- Estimated wait time is a deterministic approximation based on configured service durations; it is clearly labeled as an estimate and not a guarantee.
- No payment processing or SMS/WhatsApp gateway integration in MVP.

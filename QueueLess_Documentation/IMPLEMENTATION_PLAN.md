# Implementation Plan

## Phase 0 — Repository audit and stabilization

1. Inspect current client/server repository and package versions.
2. Identify implemented files and existing working behavior.
3. Run both apps and current tests.
4. Fix startup/configuration issues before adding features.
5. Align API prefix, model names, cookie behavior, and database schema with these docs.
6. Add migrations and lint/test scripts.

Exit criteria: local frontend and backend start; DB connects; auth tests pass.

## Phase 1 — Foundation and authentication

- Environment validation.
- Sequelize connection.
- Migrations for users.
- Register/login/logout/me.
- Password hashing.
- Cookie and CSRF strategy.
- Auth context and login/register UI.
- Role middleware.
- Tests.

Exit criteria: full auth journey works and unauthorized requests fail.

## Phase 2 — Business and services

- Business CRUD and ownership.
- Public business discovery/detail.
- Service CRUD and ownership.
- Frontend onboarding and owner settings.
- Tests for cross-owner access.

Exit criteria: owner can create business and services; public can discover active business/services.

## Phase 3 — Appointment and queue engine

- Daily queue record creation.
- Transactional token allocation.
- Appointment creation and list.
- Customer cancellation.
- Owner appointment list.
- Queue state transitions.
- Queue snapshot and wait estimate.
- Concurrency and integrity tests.

Exit criteria: no duplicate tokens under tested concurrent requests; state machine rules enforced.

## Phase 4 — Real-time and dashboards

- Socket.IO server and client.
- Public room join validation.
- Queue-changed events after commit.
- Customer queue page.
- Owner dashboard and queue controls.
- Reconnect/refetch behavior.

Exit criteria: owner action updates connected customer/public queue displays.

## Phase 5 — UX, QA, demo data

- Responsive polish.
- Empty/loading/error states.
- Accessibility checks.
- Seed data and demo credentials.
- End-to-end happy paths.
- Security and authorization regression suite.

Exit criteria: all critical acceptance tests pass.

## Phase 6 — Deployment and handoff

- Railway MySQL and API deployment.
- Vercel frontend deployment.
- Environment variables and custom origins.
- Health/readiness checks.
- Production smoke tests.
- README and architecture diagrams.
- Demo video script and recording.
- Final known limitations.

Exit criteria: live URL works in a clean browser and demo accounts can complete workflows.

## Priority rules

P0: authentication, ownership security, database integrity, booking, queue transitions, deployment.  
P1: polished UI, search, pagination, live updates, demo seed.  
P2: analytics, advanced filtering, extra animation, optional enhancements.

Do not start P2 while any P0 acceptance test fails.

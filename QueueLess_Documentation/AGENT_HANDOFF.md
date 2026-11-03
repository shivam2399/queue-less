# Coding Agent Handoff — QueueLess

You are the lead engineer responsible for completing QueueLess. Treat this repository and the documentation package as a product implementation assignment, not a tutorial exercise.

## 1. Read first

Read all files in `docs/`, especially:
1. `00-START-HERE.md`
2. `PRD.md`
3. `TRD.md`
4. `SYSTEM_DESIGN.md`
5. `DATABASE_SCHEMA.md`
6. `API_SPECIFICATION.md`
7. `SECURITY_SPECIFICATION.md`
8. `DESIGN_SYSTEM.md`
9. `IMPLEMENTATION_PLAN.md`
10. `TESTING_STRATEGY.md`

## 2. Non-negotiable constraints

- Use JavaScript throughout. Do not convert the project to TypeScript.
- Keep Next.js + Tailwind + shadcn/ui frontend.
- Keep Express + Sequelize + MySQL backend.
- Deploy frontend to Vercel and backend/database to Railway.
- Use a modular monolith; do not introduce microservices.
- MySQL is the source of truth.
- Preserve working code where reasonable; inspect before replacing.
- Do not invent completed functionality. Verify it by running tests or exercising it.
- Do not hardcode secrets, production credentials, or demo passwords into source code.
- Do not expose customer PII in public queue endpoints or socket events.
- Do not trust user IDs, role values, token numbers, or queue positions from the browser.
- Do not use `sequelize.sync({ alter: true })` in production.
- Do not claim a feature is complete unless implementation and acceptance tests exist.

## 3. First action: repository audit

Before writing code:
1. Inspect repository tree, package files, environment examples, existing code, and git status.
2. Identify what is already implemented and what is missing.
3. Run existing frontend/backend tests and startup commands.
4. Record broken behavior and dependency/version issues.
5. Compare current implementation with this specification.
6. Create `docs/IMPLEMENTATION_STATUS.md` with a checklist of existing, missing, and broken items.
7. Do not overwrite a working module without explaining why.

## 4. Resolve known starter inconsistencies

The initial starter implementation may contain:
- API routes under `/api` rather than `/api/v1`.
- `booked` status in an early Appointment model while final queue model uses `waiting`.
- `BusinessQueue` naming variations.
- Cookie authentication without a complete CSRF implementation.
- `sequelize.sync()` during startup.
- Frontend login/register pages but incomplete protected-route UX.
- Missing migration and seed infrastructure.

Reconcile these consistently across model, migrations, services, routes, frontend, docs, and tests. Do not maintain conflicting status enums or endpoint prefixes.

Recommended final appointment status enum:
`waiting`, `serving`, `completed`, `cancelled`, `no_show`.

If a separate pre-queue `booked` status is genuinely needed, update the state machine and all docs/tests explicitly before implementing it.

## 5. Work in phases

Follow `IMPLEMENTATION_PLAN.md`. Complete one phase at a time. At the end of each phase:
- Run lint.
- Run relevant tests.
- Run app locally if possible.
- Update `IMPLEMENTATION_STATUS.md`.
- Summarize changed files, behavior, tests, and remaining blockers.

Do not jump to visual polish while core authorization, transactions, or state transitions are broken.

## 6. Required engineering quality

### Backend
- Keep route/controller/service/model responsibilities separate.
- Validate body, params, and query.
- Use safe DTOs.
- Use Sequelize migrations.
- Use database transactions for booking/token allocation and queue state transitions.
- Lock the daily queue row during token allocation.
- Handle duplicate daily queue row creation race safely.
- Enforce unique `(business_id, appointment_date, token_number)`.
- Enforce unique `(business_id, queue_date)` for daily queue counter.
- Scope owner queries by authenticated owner ID.
- Scope customer appointment queries by authenticated customer ID.
- Use centralized errors and consistent status codes.
- Gracefully shut down HTTP and DB connections.

### Frontend
- Use the design tokens in `DESIGN_SYSTEM.md`.
- Build responsive screens described in `UI_UX_SPECIFICATION.md`.
- Keep API calls in service modules.
- Handle loading, empty, error, success, and unauthorized states.
- Avoid fake/mock data in production UI. Demo data must come from seed scripts/API.
- Protect pages for user experience, but never rely on frontend route guards as security.

### Real-time
- Socket.IO event is a notification; API/DB snapshot is authoritative.
- Emit only after transaction commit.
- Validate room joins.
- Re-fetch on reconnect.
- Do not broadcast customer PII.

### Security
- Implement cookie and CSRF strategy from `SECURITY_SPECIFICATION.md`.
- Use exact CORS origin with credentials.
- Never store JWT in localStorage.
- Rate limit auth.
- Do not log secrets.
- Test cross-account and cross-owner access denial.

## 7. Required screens

At minimum:
- Landing page.
- Login/register.
- Business discovery.
- Business details and service list.
- Booking flow.
- Customer appointments.
- Customer queue tracking.
- Owner dashboard.
- Owner business settings.
- Owner service management.
- Public queue display.

## 8. Required backend capabilities

At minimum:
- Auth register/login/logout/me.
- Business discovery/detail/create/update.
- Service list/create/update/deactivate.
- Appointment create/list/cancel.
- Owner appointment list.
- Public queue snapshot.
- Owner call-next/complete-current/no-show/pause.
- Socket.IO queue updates.

## 9. Demo and release

- Add deterministic synthetic seed data.
- Provide demo customer and owner accounts through a safe documented mechanism.
- Deploy to Vercel and Railway.
- Verify cookies, CORS, CSRF, database migrations, and Socket.IO in production.
- Add screenshots or GIFs to README if available.
- Prepare a 4–6 minute demo flow.
- Document limitations honestly.

## 10. Definition of done

The project is done only when:
- Every P0 acceptance criterion in PRD passes.
- Critical tests in TESTING_STRATEGY pass.
- Two concurrent bookings cannot get the same token.
- Cross-customer and cross-owner access tests pass.
- Queue transitions are transactional and valid.
- Public queue reveals no private customer data.
- Socket reconnect restores current state.
- Production deployment is reachable and functional.
- README setup instructions work from a clean clone.
- No secrets are committed.
- Known limitations are documented.

## 11. Agent response format

At each checkpoint report:
1. Phase completed.
2. Features implemented.
3. Important files changed.
4. Commands run.
5. Test results (include actual counts).
6. Known issues and blockers.
7. Next recommended phase.

If a requirement is ambiguous or a security-sensitive tradeoff is needed, stop and explain the options instead of silently choosing an unsafe shortcut.

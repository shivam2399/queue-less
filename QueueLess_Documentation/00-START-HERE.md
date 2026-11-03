# QueueLess — Documentation Index

**Product:** QueueLess  
**Document version:** 1.0  
**Status:** MVP specification  
**Target:** Publicly accessible portfolio capstone  
**Primary stack:** Next.js (JavaScript), Tailwind CSS, shadcn/ui, Node.js, Express, MySQL, Sequelize

## Purpose

This documentation package is the source of truth for designing, implementing, testing, and deploying QueueLess. Read `AGENT_HANDOFF.md` first, then the product, technical, data, API, security, design, and delivery specifications.

## Documents

| File | Purpose |
|---|---|
| `PRD.md` | Product vision, users, scope, requirements, success criteria |
| `USER_FLOWS.md` | End-to-end user journeys and states |
| `FEATURE_SPECIFICATION.md` | Detailed feature behavior and acceptance criteria |
| `TRD.md` | Technology, code organization, implementation standards |
| `SYSTEM_DESIGN.md` | Architecture, concurrency, real-time design, limitations |
| `DATABASE_SCHEMA.md` | Relational model, associations, indexes, integrity |
| `API_SPECIFICATION.md` | REST contract, payloads, errors, authorization |
| `SECURITY_SPECIFICATION.md` | Authentication, cookies, CSRF, RBAC, operational security |
| `DESIGN_SYSTEM.md` | Visual tokens, typography, components, interaction rules |
| `UI_UX_SPECIFICATION.md` | Screens, page layouts, responsive behavior |
| `IMPLEMENTATION_PLAN.md` | Sequenced work, dependencies, definition of done |
| `TESTING_STRATEGY.md` | Test pyramid, scenarios, critical acceptance tests |
| `DEPLOYMENT_GUIDE.md` | Vercel, Railway, environment variables, release checks |
| `AGENT_HANDOFF.md` | Instructions and guardrails for an autonomous coding agent |
| `README.md` | Developer-facing project setup and usage |

## Product summary

QueueLess is a lightweight appointment and walk-in queue management platform for small service businesses such as clinics, salons, repair shops, and local service centers. Customers can discover a business, view services, book a visit, receive a queue token, and follow queue progress. Business owners can configure their business and services, manage the daily queue, and update appointment states.

## MVP principles

1. Ship a complete, coherent vertical slice before adding optional infrastructure.
2. Use a modular monolith backend; do not introduce microservices.
3. MySQL is the source of truth for bookings, token allocation, and queue state.
4. Use transactions and database constraints for correctness under concurrent requests.
5. Use Socket.IO as a real-time delivery mechanism, not as the source of truth.
6. Prefer clear, testable business logic over clever abstractions.
7. Do not claim production readiness until security, tests, deployment, and operational checks pass.

## Scope note

The first MVP is designed for a single-location business account with one shared daily queue. Multi-branch operations, employee-specific calendars, payments, SMS/WhatsApp, AI predictions, and advanced analytics are out of scope unless explicitly approved later.

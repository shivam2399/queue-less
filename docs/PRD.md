# Product Requirements Document (PRD)

## 1. Overview

**Product name:** QueueLess  
**Tagline:** Book ahead. Know your place. Skip the uncertainty.  
**Product category:** Appointment and walk-in queue management SaaS  
**Initial market:** Small local service businesses; demo data may represent clinics, salons, repair shops, and similar businesses.

QueueLess reduces uncertainty and unnecessary physical waiting. Customers can book a visit and monitor their queue. Business owners can manage services and control the daily queue from one dashboard.

## 2. Problem statement

Many small service businesses coordinate appointments and walk-ins through phone calls, paper registers, spreadsheets, or messaging apps. This creates several problems:

- Customers cannot reliably tell how long they will wait.
- Staff spend time answering repetitive “when is my turn?” questions.
- Appointments and walk-ins can be difficult to coordinate.
- Customers may arrive when a business is already overloaded.
- Business owners have limited visibility into daily queue activity.

QueueLess provides a simple digital workflow without requiring a complex enterprise scheduling system.

## 3. Product vision

Make queue and appointment management accessible to small businesses with a setup process that takes only a few minutes and a customer experience that works on a mobile browser.

## 4. Goals

### MVP goals

- A customer can register, log in, discover active businesses, inspect services, book an appointment, and view their booking/token.
- A business owner can register, create one business, configure services, and manage that business's daily queue.
- Queue state is persisted in MySQL and delivered to connected clients in near real time.
- The system prevents duplicate daily token allocation under concurrent booking requests.
- A visitor can open a public queue display for an active business.
- The application is deployed publicly and includes seeded demo data and documented demo accounts.

### Non-goals

- Payments or refunds.
- SMS, WhatsApp, push notifications.
- Multi-branch business management.
- Staff-specific schedules or employee assignment.
- Complex recurring appointments.
- AI/ML wait-time prediction.
- Native mobile apps.
- Microservices, Kubernetes, Kafka, or mandatory Redis.
- Full healthcare records or storage of sensitive medical information.

## 5. Personas

### Customer
Wants to book a service quickly, know their token and understand whether they should leave for the business yet.

Needs: simple discovery, clear service details, booking confirmation, queue status, cancellation rules.

### Business owner
Owns or operates a local service business and needs to control the day's appointments and walk-ins.

Needs: easy onboarding, service management, a live queue, safe status transitions, clear operational state.

### Public visitor
May not have an account but wants to see a business's current public queue status.

Needs: read-only queue display with no access to customer personal information.

## 6. Roles and permissions

- `customer`: can manage their own profile and appointments; can view public business and queue information.
- `business_owner`: can manage businesses they own, their services, and appointments/queues belonging to those businesses.
- `admin`: reserved for future internal administration; do not expose public admin registration in MVP.

A user must never gain access to another user's records by changing an ID in a URL or request body.

## 7. MVP functional requirements

### Authentication
- Register with name, email, password, and account type (`customer` or `business_owner`).
- Login with email and password.
- Logout and clear the session cookie.
- Restore current session on refresh.
- Hash passwords with bcrypt-compatible hashing.
- Validate inputs and return consistent errors.

### Business discovery and setup
- Public list of active businesses.
- Public business detail page.
- Owner can create and update their business profile.
- One business per owner in MVP unless the implementation explicitly supports multiple; database design may allow multiple, but UI should keep setup simple.
- Owner can activate/deactivate their business.

### Service management
- Owner can create, edit, activate/deactivate, and list services.
- A service belongs to exactly one business.
- Service fields: name, description, duration in minutes, price, active state.
- Only active services are bookable.

### Appointment and queue
- Customer selects a business and service and books for a valid operating date.
- MVP queue is daily and sequential per business.
- Successful booking receives a unique token number within that business and date.
- Booking and token allocation must be atomic.
- Customer can list and cancel their own eligible appointments.
- Owner can list today's appointments and advance queue state.
- Queue status transitions: `waiting` → `serving` → `completed`; eligible waiting bookings may transition to `cancelled` or `no_show`.
- Queue position is derived from authoritative persisted records, not trusted from the browser.
- Queue updates are emitted to subscribed clients after the database transaction commits.

### Public queue display
- Public read-only page for a business/date.
- Shows current serving token, count of waiting customers, and a conservative estimated wait.
- Does not expose customer email, phone, or full name. Display token number only (or a deliberately configured first name if approved; default is token only).
- Updates in real time when connected; refetches state after reconnect.

## 8. Booking policy and business rules

- Store timestamps consistently; use the business timezone for determining queue date.
- MVP assumes one shared queue per business per local calendar date.
- Token numbers start at 1 each business day and are never reused that day, even after cancellation.
- A cancelled token remains part of the day's history; subsequent tokens are not renumbered.
- Only active businesses and active services can receive new bookings.
- Service duration must be a positive integer, minimum 5 minutes.
- Price is a non-negative decimal.
- A customer may not cancel an appointment that is already `serving`, `completed`, or `no_show`.
- Owner actions must be scoped to a business the authenticated user owns.
- Queue progression must not skip or serve a cancelled/completed token as the next customer.
- If there are no waiting appointments, the queue is idle.
- For the MVP, bookings are for the current business day or a future date within a configurable booking horizon (default 14 days). Do not silently accept past dates.

## 9. Estimated waiting time

For MVP, use a transparent deterministic estimate:
- Determine waiting appointments ahead of the customer's token.
- Sum their configured service durations.
- If a customer is currently being served, add the remaining estimate only if the system has a reliable start time; otherwise use the full service duration as a conservative estimate.
- Clearly label the value as an estimate, not a guarantee.
- Document assumptions and limitations in the UI.

Do not use machine learning or claim predictive accuracy.

## 10. Non-functional requirements

- Responsive from 360px mobile width to desktop.
- Core customer booking workflow should be understandable without onboarding.
- API validation and authorization on every protected endpoint.
- No plaintext passwords or secrets in source control.
- Use database constraints for uniqueness and referential integrity.
- Structured logs sufficient to diagnose API and database errors.
- Health endpoint for deployment monitoring.
- Graceful handling of database unavailability.
- Basic automated tests for auth, permissions, booking concurrency, and queue transitions.
- Public demo should use synthetic data only.

## 11. Success criteria

MVP is accepted when:

1. A new customer can register, log in, book a service, see their token, and cancel an eligible booking.
2. A business owner can register, create a business, create services, and operate the queue.
3. A second owner cannot read or mutate the first owner's business data.
4. Two concurrent booking requests cannot receive the same token for the same business/date.
5. Queue state survives API restart.
6. Public queue display updates after owner advances the queue.
7. Application works on mobile and desktop.
8. Deployment, README, demo credentials, and demo video are available.
9. No critical security or data-integrity test is failing.

## 12. Product risks

| Risk | Mitigation |
|---|---|
| Businesses have different queue practices | Document single shared queue assumptions; keep service durations configurable |
| Customers interpret wait estimate as a promise | Label as estimate and explain calculation |
| Network disconnect causes stale display | Reconnect and fetch authoritative queue snapshot |
| Concurrent booking creates duplicate token | Transaction + row lock + unique index + retry/conflict handling |
| Owner accesses another business | Ownership-scoped service queries and authorization tests |
| Demo data is mistaken for real business data | Clearly label seeded demo environment |

## 13. MVP release boundary

The MVP is a portfolio-grade demonstrator, not a certified healthcare, payment, or mission-critical scheduling platform. Do not market it as guaranteeing exact wait times or uninterrupted availability.

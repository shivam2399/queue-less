# Testing Strategy

## 1. Test pyramid

- Unit tests: pure business rules, validators, wait estimate, state transitions.
- Integration tests: API + test MySQL database + Sequelize transactions.
- End-to-end tests: customer and owner browser journeys.
- Manual smoke tests: deployment, cookies, socket reconnect, responsive layout.

Use Jest or Vitest consistently with the chosen backend/frontend tooling. Use Supertest for Express API tests and Playwright for browser E2E.

## 2. Critical backend tests

### Authentication
- Register valid customer.
- Register valid owner.
- Reject duplicate email.
- Reject invalid email and weak password.
- Reject public admin role.
- Login valid/invalid credentials.
- `/auth/me` rejects missing/expired token.
- Logout clears cookie.
- Inactive account cannot authenticate.

### Authorization
- Customer A cannot read/cancel Customer B appointment.
- Owner A cannot read/update Owner B business.
- Owner A cannot create service under Owner B business.
- Owner A cannot call next on Owner B queue.
- Public endpoint returns no private customer fields.

### Booking and concurrency
- Valid booking receives token 1.
- Second booking same business/date receives token 2.
- Different business can start at token 1.
- Different date can start at token 1.
- Cancelled token is not reused.
- Inactive service/business cannot be booked.
- Past date rejected.
- Service/business mismatch rejected.
- Concurrent booking requests receive distinct tokens.
- Failed transaction leaves no partial appointment or counter increment.

### Queue state
- Call next selects lowest waiting token.
- Call next conflicts if another appointment is serving.
- Complete current marks serving appointment completed.
- Next call selects next waiting appointment.
- Cancelled/no-show/completed appointments are skipped.
- Non-owner cannot mutate queue.
- Paused queue rejects or clearly blocks call-next according to policy.

## 3. Frontend tests

- Login/register validation.
- Loading and error states.
- Role-aware navigation.
- Customer appointment list.
- Owner dashboard.
- Queue empty state.
- Socket reconnect triggers refetch.
- Mobile navigation and responsive layout.

## 4. E2E critical journey

1. Register business owner.
2. Create business.
3. Create two services.
4. Register customer in separate browser context.
5. Discover business.
6. Book service.
7. Confirm token shown.
8. Owner sees appointment.
9. Owner calls next.
10. Customer queue page updates.
11. Owner completes appointment.
12. Customer sees updated state.
13. Verify another owner cannot access this business.

## 5. Release gates

- No failing P0 tests.
- No critical/high security issue known.
- Migrations work on an empty database.
- Seed script is repeatable or safely documented.
- No secrets in repository.
- Production smoke test passes.
- Demo accounts work.

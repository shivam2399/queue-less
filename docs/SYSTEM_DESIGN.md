# System Design

## 1. High-level design

Browser → Next.js UI → Express REST API / Socket.IO → service layer → Sequelize → MySQL.

The backend is a modular monolith. The database is the source of truth. Socket.IO distributes notifications after successful commits.

## 2. Core components

### Frontend
- Public business discovery.
- Customer booking and appointment pages.
- Owner dashboard.
- Public queue display.
- Auth/session context.
- API client and socket client.

### API
- Authentication and authorization.
- Business and service management.
- Appointment lifecycle.
- Queue orchestration.
- Public read-only queue queries.

### Persistence
- Users, businesses, services, appointments, daily queue counters.
- Foreign keys, unique constraints, indexes.
- Transactions around multi-row state changes.

### Real-time layer
- Authenticated owner room subscriptions.
- Public queue room subscriptions.
- Minimal queue-changed event.
- Refetch on reconnect.

## 3. Booking and token allocation concurrency

### Problem
Two requests can read the same current token counter and both attempt to allocate the next token.

### Required approach
1. Start a MySQL transaction.
2. Find or create the daily queue counter row for `(business_id, queue_date)`.
3. Lock that row using a transaction-scoped update/row lock (`SELECT ... FOR UPDATE`, Sequelize transaction lock where supported).
4. Increment `last_token`.
5. Create appointment with that token and `waiting` status.
6. Commit.
7. Emit queue update only after commit.

Use a unique constraint on `(business_id, appointment_date, token_number)` as a final integrity guard.

Creation of the daily counter row itself can race. Handle duplicate-key conflict by retrying the transaction/read-lock sequence. Keep retry count bounded. Do not rely only on a prior `MAX(token_number) + 1` query without a lock.

### Idempotency
If practical, accept an `Idempotency-Key` for booking. Store the key per customer/request and return the original result on retries. If omitted from MVP, document that network retries can create another booking and ensure the UI does not automatically resubmit after an ambiguous timeout.

## 4. Queue state machine

Recommended appointment states:

- `waiting`
- `serving`
- `completed`
- `cancelled`
- `no_show`

Allowed transitions:

| From | To | Actor | Conditions |
|---|---|---|---|
| waiting | serving | business owner | No other active serving appointment |
| waiting | cancelled | customer or owner | Before service begins |
| serving | completed | business owner | Appointment is current serving |
| waiting | no_show | business owner | Owner confirms customer absent |
| serving | no_show | business owner | Only if business policy permits explicit override |

Terminal states: completed, cancelled, no_show.

Do not permit arbitrary status updates from the client. Implement named service operations.

## 5. Single active serving appointment

Enforce in service logic inside a transaction:
- Lock daily queue row.
- Verify no appointment is currently serving.
- Select lowest-token waiting appointment.
- Transition it to serving.
- Commit.
- Emit event after commit.

If MySQL version and schema support a suitable generated/functional uniqueness mechanism, a database constraint may additionally enforce one active serving appointment. Do not assume a partial unique index exists in MySQL. At minimum, serialize transitions through the locked daily queue row and test concurrency.

## 6. Queue position and wait estimate

Queue position is derived by counting eligible waiting appointments with a lower token for the same business/date. Never trust a client-supplied position.

Basic wait estimate:
- Sum `duration_minutes` for waiting appointments ahead.
- If a serving appointment exists, add its full service duration as conservative approximation.
- Return estimate in minutes and an explanatory label.
- Recompute on reads; cache is unnecessary for MVP.

Limitations:
- Actual service duration varies.
- Staff capacity and breaks are not modeled.
- A single queue is assumed.
- The estimate is not a promise.

## 7. Real-time event design

Event name: `queue:updated`.

Payload should be minimal:

```json
{
  "businessId": 42,
  "queueDate": "2026-11-03",
  "version": 18
}
```

Client receives event and fetches public queue snapshot. Avoid broadcasting customer names or contact details.

Rooms:
- `public:business:{businessId}:date:{date}`
- `owner:business:{businessId}:date:{date}` (authenticated and ownership-checked)

For a small MVP, one Socket.IO server instance is sufficient. If horizontally scaled later, use a compatible Socket.IO Redis adapter and sticky-session/load-balancer configuration as required.

## 8. Scalability path

| Current MVP | Future scale path |
|---|---|
| Single Express instance | Multiple API instances behind load balancer |
| MySQL primary | Read replicas for read-heavy workloads |
| DB-derived queue reads | Carefully invalidated Redis cache |
| Single Socket.IO instance | Redis adapter / managed pub-sub |
| Inline email (if added) | Background job worker |
| Basic logs | Centralized structured logging and metrics |

Do not add infrastructure before there is a measured need.

## 9. Failure modes

| Failure | Expected behavior |
|---|---|
| API unavailable | UI displays retryable error; no fake confirmation |
| DB unavailable | API returns 503/500 safely; logs diagnostic context |
| Socket disconnect | Client displays reconnecting state and refetches on reconnect |
| Event lost | Client polling/refetch on visibility or reconnect restores truth |
| Duplicate booking race | Transaction/unique index prevents duplicate token |
| Owner attempts foreign business ID | 403 or 404 without leaking data |
| Worker/server restart | Queue state persists in MySQL |
| Deployment cold start | Health/readiness checks and loading UI |

## 10. Security boundaries

- Public endpoints return minimal data.
- Authenticated endpoints require valid session.
- Owner actions are ownership-scoped.
- Socket room joins are validated.
- All state transitions are server-side.
- CSRF protection is required for cookie-authenticated mutations.
- Rate limits apply to authentication and abuse-prone endpoints.

## 11. Known limitations to disclose

- Single shared queue per business/day.
- No employee-level scheduling.
- No exact appointment-slot reservation unless separately implemented.
- No payment processing.
- No guaranteed wait time.
- No SMS/WhatsApp notification delivery.
- No multi-region/high-availability architecture in MVP.

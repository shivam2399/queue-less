# API Specification

Base URL local: `http://localhost:5000/api/v1`  
Production: configured public Railway API origin + `/api/v1`  
All bodies are JSON unless noted. Cookie-based auth uses `credentials: include`.

## 1. Response conventions

Success:

```json
{
  "success": true,
  "message": "Business created",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": []
}
```

Status codes: 200 success, 201 created, 204 no content where appropriate, 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 429 rate limited, 500 unexpected server error, 503 dependency unavailable.

## 2. Authentication

### POST `/auth/register`
Public.

Request:
```json
{
  "name": "Asha Patel",
  "email": "asha@example.com",
  "password": "StrongPass123",
  "role": "customer"
}
```

Allowed roles: `customer`, `business_owner`. Never accept `admin` from public registration.

Response: 201, safe user DTO, set HttpOnly session cookie.

### POST `/auth/login`
Public. Request `{ "email": "...", "password": "..." }`. Response 200, safe user DTO, set cookie.

### POST `/auth/logout`
Authenticated or idempotent public endpoint. Clears cookie.

### GET `/auth/me`
Authenticated. Returns safe current user DTO.

## 3. Businesses

### GET `/businesses`
Public. Query: `search`, `page`, `limit`. Returns active businesses only, paginated.

### GET `/businesses/:businessId`
Public. Returns active business profile and active services summary.

### POST `/businesses`
Business owner. Request:
```json
{
  "name": "City Care Clinic",
  "description": "Local appointment-based clinic",
  "address": "Bhilai, Chhattisgarh",
  "phone": "+91XXXXXXXXXX",
  "openingTime": "09:00",
  "closingTime": "18:00",
  "timezone": "Asia/Kolkata"
}
```
Owner ID comes from session.

### PATCH `/businesses/:businessId`
Business owner of that business. Partial update with validation.

### GET `/businesses/mine`
Business owner. Returns businesses owned by current user.

## 4. Services

### GET `/businesses/:businessId/services`
Public. Active services only.

### POST `/businesses/:businessId/services`
Owner of business. Request:
```json
{
  "name": "General Consultation",
  "description": "Standard consultation",
  "durationMinutes": 20,
  "price": 300
}
```

### PATCH `/services/:serviceId`
Owner of parent business. Supports name, description, durationMinutes, price, isActive.

### DELETE `/services/:serviceId`
Prefer soft delete/deactivation; do not break appointment history.

## 5. Appointments

### POST `/appointments`
Customer. Request:
```json
{
  "businessId": 12,
  "serviceId": 4,
  "appointmentDate": "2026-11-04"
}
```
Customer ID comes from session. Response includes appointment ID, token number, status, queue position, estimated wait.

### GET `/appointments/mine`
Customer. Query `status`, `page`, `limit`. Only current user's appointments.

### GET `/businesses/:businessId/appointments`
Owner of business. Query `date`, `status`, `page`, `limit`.

### GET `/appointments/:appointmentId`
Customer who owns appointment or owner of related business. Return only permitted fields.

### PATCH `/appointments/:appointmentId/cancel`
Customer owner or authorized business owner. Enforce cancellation rules.

## 6. Queue

### GET `/businesses/:businessId/queue`
Public. Query `date` (defaults to current business-local date). Returns public snapshot only:
```json
{
  "success": true,
  "data": {
    "businessId": 12,
    "date": "2026-11-04",
    "isPaused": false,
    "currentServingToken": 8,
    "waitingCount": 5,
    "nextTokens": [9, 10, 11, 12, 13],
    "estimatedWaitMinutes": 85,
    "estimateDisclaimer": "Waiting time is an estimate and may change."
  }
}
```

### POST `/businesses/:businessId/queue/call-next`
Owner of business. No client-supplied customer/token selection in normal flow. Transactionally selects next waiting token and marks serving. Return 409 if another appointment is currently serving.

### POST `/businesses/:businessId/queue/complete-current`
Owner of business. Marks current serving appointment completed.

### POST `/businesses/:businessId/queue/appointments/:appointmentId/no-show`
Owner of business. Marks eligible appointment no-show.

### PATCH `/businesses/:businessId/queue/pause`
Owner of business. Request `{ "isPaused": true }`.

## 7. Socket.IO

Connect to API origin with cookie credentials.

Client joins public room only after server validates business/date:
- Event: `queue:join`
- Payload: `{ "businessId": 12, "date": "2026-11-04" }`

Server emits:
- Event: `queue:updated`
- Payload: `{ "businessId": 12, "date": "2026-11-04", "version": 18 }`

Client refetches `GET /businesses/:businessId/queue` after receiving event and on reconnect.

Private owner events, if implemented, require authenticated socket and ownership verification.

## 8. Pagination

Use `page` (default 1) and `limit` (default 20, max 100). Return:
```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

## 9. API rules

- Never accept `customerId` or `ownerId` from a public request to determine authorization.
- Validate all IDs and query parameters.
- Use DTOs; do not serialize raw ORM models.
- Avoid exposing password hashes, internal tokens, or private contact information in public queue responses.
- Use 409 for state/concurrency conflicts.
- Keep API docs synchronized with implementation and tests.

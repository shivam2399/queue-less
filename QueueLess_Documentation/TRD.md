# Technical Requirements Document (TRD)

## 1. Architecture

Use a modular monolith backend and a separately deployed Next.js frontend.

- `client/`: Next.js App Router, JavaScript, Tailwind CSS, shadcn/ui.
- `server/`: Node.js, Express 5, Sequelize 6, MySQL 8.
- REST API under `/api/v1` (recommended). If the existing repository already exposes `/api`, either preserve it consistently or migrate all client/docs/tests together. Do not mix versioned and unversioned routes.
- Socket.IO mounted on the same backend HTTP server.
- MySQL is authoritative for all business state.
- No microservices in MVP.

## 2. Runtime and versions

Use current stable compatible versions available at implementation time; pin dependencies in lockfiles. Avoid blindly copying version numbers from old snippets. Use Node.js LTS supported by Vercel/Railway and declare it in `engines`.

## 3. Backend module boundaries

Recommended structure:

```text
server/src/
  config/          # env, database
  models/          # Sequelize model definitions
  migrations/      # schema migrations
  seeders/         # deterministic demo data
  modules/
    auth/
      auth.routes.js
      auth.controller.js
      auth.service.js
      auth.validator.js
    businesses/
    services/
    appointments/
    queue/
  middleware/      # auth, role, validation, errors, rate limit
  sockets/         # Socket.IO setup and events
  utils/
  app.js
  server.js
```

If a starter repository already uses `controllers/`, `services/`, and `routes/` directories, the agent may retain that layout but must keep responsibilities separated.

### Layer responsibilities

- Route: URL, HTTP method, middleware composition.
- Validator: validate and normalize untrusted input.
- Controller: translate HTTP request to service call and response.
- Service: business rules and transaction orchestration.
- Model/repository: persistence and queries.
- Middleware: cross-cutting concerns.
- Socket layer: publish committed state changes.

Do not put business rules in React components or route handlers.

## 4. Frontend boundaries

Recommended structure:

```text
client/src/
  app/
  components/
    ui/
    layout/
    business/
    booking/
    queue/
  features/
    auth/
    businesses/
    services/
    appointments/
    queue/
  lib/
  hooks/
  context/
```

Use server components for public/static data where practical. Use client components for forms, interactive dashboards, and Socket.IO subscriptions. Keep API access in service modules. Avoid putting secrets in `NEXT_PUBLIC_*` variables.

## 5. API conventions

- JSON request and response bodies.
- REST resource naming.
- Consistent success/error envelope.
- Appropriate HTTP status codes.
- Pagination for list endpoints.
- Validate query, params, and body.
- Derive identity from authenticated session, never client-supplied user IDs.
- Use ISO 8601 dates and explicit business timezone rules.
- Avoid returning Sequelize instances directly; map to response DTOs.

Suggested success envelope:

```json
{
  "success": true,
  "message": "Request completed",
  "data": {}
}
```

Suggested error envelope:

```json
{
  "success": false,
  "message": "Human-readable error",
  "code": "VALIDATION_ERROR",
  "details": []
}
```

## 6. Database and migrations

- MySQL with InnoDB.
- Sequelize models and migrations are source-controlled.
- Do not use `sequelize.sync({ alter: true })` in production.
- Use migrations for schema changes.
- Use transactions for booking, token allocation, and queue transitions.
- Use foreign keys and indexes based on access patterns.
- Use DECIMAL for currency; do not use floating-point arithmetic for money.
- Store dates/times with an explicit timezone policy.

## 7. Authentication

Preferred MVP pattern: server-issued session JWT in Secure, HttpOnly cookie. For cross-origin deployment:
- `credentials: true` in CORS.
- Exact allowed frontend origin, never wildcard with credentials.
- `SameSite=None; Secure` only when truly cross-site.
- Prefer frontend/backend custom subdomains on the same registrable domain for more predictable cookie behavior.
- Add CSRF protection for cookie-authenticated unsafe methods.
- Set cookie expiration and JWT expiration consistently.
- Do not store JWT in localStorage.

If the deployment domain strategy makes cookie authentication unreliable, the agent must explain the tradeoff and propose a secure alternative before changing the auth design.

## 8. Real-time

Use Socket.IO. Events are notifications that state changed, not trusted state payloads. After an event or reconnect, client fetches authoritative queue snapshot.

Room naming: `business:{businessId}:date:{YYYY-MM-DD}`.

Never broadcast private customer information to public rooms.

## 9. Observability and reliability

- `/health` liveness endpoint.
- Optional `/ready` endpoint that verifies DB connectivity.
- Structured logs in production.
- Do not log passwords, tokens, cookies, or sensitive payloads.
- Central error handler.
- Graceful shutdown closes HTTP server and Sequelize connection.
- Database connection pool configured for hosting plan limits.
- Handle transient DB failures with safe errors; do not blindly retry non-idempotent writes.

## 10. Code quality

- JavaScript only; do not introduce TypeScript.
- CommonJS or ESM must be consistent within each package.
- ESLint configured and clean.
- Avoid `any`-like unvalidated objects; validate at boundaries.
- Use async/await.
- No duplicated authorization checks; centralize reusable policies.
- Keep functions small and testable.
- Add comments for non-obvious concurrency and timezone logic, not obvious syntax.

## 11. Deployment topology

- Next.js frontend on Vercel.
- Express API and Socket.IO on Railway using a persistent service.
- Railway MySQL service or compatible managed MySQL.
- Frontend environment variable points to public API origin.
- Backend uses Railway-provided DB connection values.
- Socket.IO must use the same public backend origin.
- Configure health check and persistent process; do not deploy Socket.IO server as a serverless function.

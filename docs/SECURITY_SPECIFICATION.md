# Security Specification

## 1. Authentication

- Passwords hashed with bcrypt or bcryptjs using an appropriate work factor (target 12 where performance permits).
- JWT signed with a strong secret of at least 32 random bytes.
- JWT includes user ID, role, issued-at, expiry; avoid unnecessary personal data.
- Session token stored in HttpOnly cookie, not localStorage.
- Cookie: `Secure` in production, `HttpOnly`, explicit `SameSite`, `Path=/`, bounded max-age.
- Logout clears cookie with matching attributes.
- Verify token and load current user from database so deactivated accounts lose access.

## 2. Cross-origin and CSRF

- Exact CORS allowlist for frontend origin.
- `credentials: true`; never combine wildcard origin with credentials.
- Cookie-authenticated state-changing requests require CSRF mitigation.
- Validate `Origin`/`Referer` as defense-in-depth; origin checking alone is not a complete CSRF defense for every client/browser scenario.
- Use a CSRF token pattern (e.g. double-submit or synchronizer token) or a same-site custom-domain deployment with a documented robust strategy.
- Do not disable browser protections to make local testing convenient.

## 3. Authorization

- Customer can access only their own appointment records.
- Owner can access only businesses where `owner_id = authenticated user id`.
- Owner's services, appointments, and queue mutations must join/filter through owned business.
- Public queue endpoint returns minimal aggregate/token data.
- Public role assignment must reject `admin`.
- Socket room join must validate business visibility and owner privileges where applicable.

## 4. Input and output

- Zod validation on body, params, and query.
- Normalize email.
- Validate dates, timezones, durations, prices, IDs.
- Escape/render user-generated text safely.
- Never return raw stack traces in production.
- Never return password hashes or session tokens in JSON.

## 5. Abuse prevention

- Rate limit registration/login.
- Consider rate limits for booking and public queue reads.
- Limit JSON payload size.
- Helmet security headers.
- Use parameterized ORM queries; avoid raw SQL interpolation.
- Add pagination caps.
- Prevent mass assignment by explicitly selecting writable fields.

## 6. Secrets and data

- `.env` files are never committed.
- Commit `.env.example` with empty placeholders only.
- Rotate secrets if exposed.
- Use synthetic demo users and data.
- Do not store medical details or other sensitive customer notes in MVP.
- Do not log credentials, cookies, JWTs, or full sensitive request bodies.

## 7. Security acceptance tests

- Unauthenticated user cannot access protected endpoints.
- Customer A cannot read/cancel Customer B's appointment.
- Owner A cannot read/update Owner B's business, services, queue, or appointments.
- Public registration cannot create admin.
- Invalid/expired JWT rejected.
- CSRF protection blocks untrusted browser origin/state-changing request.
- Public queue response contains no customer PII.
- Login rate limit works.

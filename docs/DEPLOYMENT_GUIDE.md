# Deployment Guide

## 1. Topology

- Frontend: Vercel project rooted at `/client`.
- Backend: Railway service rooted at `/server`.
- Database: Railway MySQL.
- Socket.IO: same persistent Railway backend service.
- Custom domains recommended: `app.example.com` and `api.example.com`.

Do not deploy a long-running Socket.IO server as a serverless function.

## 2. Backend environment variables

Set in Railway service:

```env
NODE_ENV=production
PORT=<provided by Railway>
CLIENT_URL=https://app.example.com

DB_HOST=<Railway MySQL host>
DB_PORT=<Railway MySQL port>
DB_NAME=<database name>
DB_USER=<database user>
DB_PASSWORD=<database password>

JWT_SECRET=<long random secret>
JWT_EXPIRES_IN=1d
```

Use Railway's provided internal/private database hostname when the API and database share the Railway project/network. Use the provided public connection details only when necessary.

## 3. Frontend environment variables

Set in Vercel:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://api.example.com
```

These values are public. Never put secrets in `NEXT_PUBLIC_*`.

## 4. Build and start commands

Backend:
- Install: `npm ci`
- Start: `npm start`
- Ensure start script launches `src/server.js`.

Frontend:
- Install: `npm ci`
- Build: `npm run build`
- Start handled by Vercel.

## 5. Database release process

1. Provision MySQL.
2. Configure credentials.
3. Run migrations as a release step.
4. Run seed script only when intended (demo environment).
5. Start API.
6. Verify readiness endpoint.

Do not run destructive schema sync on every production startup.

## 6. Cookie and CORS

- Configure exact Vercel/custom frontend origin.
- CORS must allow credentials.
- Use HTTPS.
- Set cookie attributes based on actual deployment domains.
- Prefer same-site custom subdomains for reliable cookie behavior.
- Implement CSRF token/strategy for state-changing cookie-authenticated requests.
- Test in Chrome/Firefox with third-party cookie restrictions where applicable.

## 7. Health and monitoring

- `/health`: process liveness.
- `/ready`: verifies database connectivity.
- Log startup, migration version, and errors without secrets.
- Configure Railway health check to `/health` or `/ready` depending on startup behavior.
- Configure reasonable connection pool limits for the database plan.

## 8. Production smoke test

- Landing page loads.
- Register/login works.
- Cookie persists across refresh.
- Business discovery works.
- Owner can create business/service.
- Customer can book and receive token.
- Owner can advance queue.
- Public queue updates.
- Unauthorized access is denied.
- Logout works.

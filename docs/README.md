# QueueLess

Smart appointment and queue management for local service businesses.

QueueLess helps customers book services, receive a queue token, and follow queue progress. Business owners can configure services and manage their daily queue.

## Tech stack

- Next.js, JavaScript, Tailwind CSS, shadcn/ui
- Node.js, Express
- MySQL, Sequelize
- JWT in HttpOnly cookie
- Socket.IO for queue updates
- Vercel + Railway deployment

## Repository structure

```text
queueless/
  client/      # Next.js frontend
  server/      # Express API
  docs/        # Product and engineering specifications
```

## Prerequisites

- Node.js LTS
- npm
- MySQL 8
- Git

## Local setup

### 1. Clone and install

```bash
git clone <YOUR_REPOSITORY_URL>
cd queueless

cd server
npm ci
cp .env.example .env
```

Configure database and secret values in `server/.env`.

### 2. Create database

```sql
CREATE DATABASE queueless;
```

Run migrations using the project's migration command after migrations have been implemented.

### 3. Start backend

```bash
cd server
npm run dev
```

API default: `http://localhost:5000`  
Health: `http://localhost:5000/health`

### 4. Start frontend

In a second terminal:

```bash
cd client
npm ci
cp .env.example .env.local
npm run dev
```

Frontend default: `http://localhost:3000`

## Environment variables

See `server/.env.example` and `client/.env.example`. Never commit real secrets.

## Demo accounts

Add synthetic demo credentials here only after creating them through a repeatable seed process. Do not use real personal accounts.

## Scripts

Document actual scripts from package files, including dev, build, start, test, lint, migration, and seed commands.

## API documentation

See `docs/API_SPECIFICATION.md`.

## Architecture

See `docs/TRD.md`, `docs/SYSTEM_DESIGN.md`, and `docs/DATABASE_SCHEMA.md`.

## Testing

See `docs/TESTING_STRATEGY.md`. Run unit, integration, and E2E tests before release.

## Deployment

See `docs/DEPLOYMENT_GUIDE.md`.

## Known limitations

- One shared queue per business per local date.
- No staff-specific scheduling.
- Estimated waiting time is approximate.
- No payments or SMS/WhatsApp notifications.
- MVP is not designed as a high-availability or regulated healthcare system.

## License

Choose and add a license before public release.

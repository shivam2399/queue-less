# QueueLess Agent Execution Checklist

Use this as a progress tracker. The agent should update this file as work is completed.

## Repository audit
- [ ] Inspect repository and git status
- [ ] Run existing frontend/backend
- [ ] Record current implementation status
- [ ] Resolve API prefix and appointment status consistency

## Foundation and auth
- [ ] Environment validation
- [ ] MySQL connection
- [ ] Initial migrations
- [ ] Register/login/logout/me
- [ ] Cookie + CSRF protection
- [ ] Auth and role tests

## Business and services
- [ ] Business create/update/list/detail
- [ ] Ownership enforcement
- [ ] Service CRUD/deactivation
- [ ] Public discovery UI
- [ ] Business onboarding UI
- [ ] Service management UI
- [ ] Authorization tests

## Booking and queue
- [ ] Transactional token allocation
- [ ] Unique daily token constraint
- [ ] Appointment create/list/cancel
- [ ] Queue state machine
- [ ] Queue snapshot and wait estimate
- [ ] Concurrency tests

## Realtime and UI
- [ ] Socket.IO server
- [ ] Validated room joins
- [ ] Emit after transaction commit
- [ ] Reconnect/refetch behavior
- [ ] Owner dashboard
- [ ] Customer queue tracking
- [ ] Public queue display
- [ ] Responsive and accessibility QA

## Release
- [ ] Seed demo data
- [ ] Unit/integration/E2E tests
- [ ] Railway deployment
- [ ] Vercel deployment
- [ ] Production smoke tests
- [ ] README complete
- [ ] Demo video recorded

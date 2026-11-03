# UI/UX Specification

## 1. Global navigation

### Public navigation
- QueueLess wordmark.
- Explore businesses.
- Sign in.
- Get started.

### Customer navigation
- Home / Explore.
- My appointments.
- Profile.
- Logout.

### Business owner navigation
- Overview.
- Queue.
- Appointments.
- Services.
- Business settings.
- Logout.

Use role-aware navigation but enforce all permissions on the server.

## 2. Required screens

### `/` Landing page
- Clear value proposition.
- CTA: Find a business.
- Secondary CTA: Manage your business.
- Short explanation: discover → book → track.
- Demo business cards.
- Responsive header and footer.

### `/login`
- Email/password form.
- Inline errors.
- Loading state.
- Link to registration.
- Do not reveal whether an email exists.

### `/register`
- Name, email, password, role selection.
- Customer/business owner choices.
- Inline validation.
- Link to login.

### `/businesses`
- Search and business cards.
- Business name, location, description.
- Loading, empty, and error states.

### `/businesses/[businessId]`
- Business profile.
- Active services with duration and price.
- Book action for authenticated customer.
- Sign-in prompt for visitor.

### `/book/[businessId]`
- Service and date selection.
- Booking summary.
- Clear note that token is queue order, not an exact time slot.
- Confirmation step.
- Disable repeated submission while request is pending.

### `/appointments`
- Customer's appointments.
- Status badges.
- Token number and date.
- Cancel eligible appointment.
- Link to live queue.

### `/dashboard`
- Owner overview.
- Today's queue summary.
- Current serving token.
- Call next / complete current actions.
- Waiting list.
- Quick links to services and settings.

### `/dashboard/services`
- Service list.
- Create/edit dialog.
- Activate/deactivate service.
- Price and duration validation.

### `/dashboard/business`
- Business profile form.
- Opening/closing time.
- Timezone.
- Active/inactive state.

### `/queue/[businessId]`
- Public read-only queue.
- Current serving token.
- Waiting count and next tokens.
- Estimated wait disclaimer.
- Live connection indicator.
- No customer PII.

## 3. Loading and error states

Every asynchronous page must support:
- Loading skeleton.
- Empty state.
- Error with retry.
- Unauthorized redirect or access-denied view.
- Form submission pending state.
- Success feedback.

## 4. Interaction requirements

- Confirm cancellation and other destructive actions.
- Prevent double clicks during mutations.
- Optimistically update only when rollback is implemented; otherwise wait for server response.
- After queue event, refetch snapshot.
- If socket disconnects, show a subtle reconnecting indicator and preserve last known data with a stale label.
- Never show fabricated queue position or fake appointment confirmation.

## 5. Demo usability

Seed at least:
- One demo business (e.g. “QueueLess Demo Clinic”).
- Three active services with different durations.
- Several synthetic appointments in different states.
- One customer account and one owner account.

Display demo credentials only in a clearly labeled demo section or README. Do not seed real personal data.

# Feature Specification and Acceptance Criteria

## F-01 Authentication

**Register**
- Fields: name, email, password, account type.
- Email normalized to lowercase and trimmed.
- Password minimum 8 characters; enforce a sensible maximum compatible with chosen hashing library.
- Public roles restricted to customer and business_owner.
- Duplicate email returns HTTP 409.
- Response omits password/hash.
- Session cookie is HttpOnly.

**Login**
- Generic invalid-credentials message.
- Inactive account cannot log in.
- Successful login sets cookie and returns safe user profile.

**Session**
- `/auth/me` returns authenticated user.
- Expired/missing token returns 401.
- Logout clears cookie using matching path/domain/security attributes.

Acceptance: register → login → refresh → `/me` still authenticated → logout → `/me` returns 401.

## F-02 Business profile

Fields: name, description, address, phone, openingTime, closingTime, timezone, isActive.

Acceptance:
- Owner can create business.
- Owner can update only their own business.
- Public users can see active business details.
- Inactive business is not bookable.
- Validate opening and closing times and timezone.

## F-03 Services

Fields: name, description, durationMinutes, price, isActive.

Acceptance:
- Service is created under an owned business.
- Duration is integer >= 5.
- Price >= 0.
- Customer can only book active services.
- Owner cannot manipulate services belonging to another owner.

## F-04 Booking

Input: businessId, serviceId, appointmentDate. Customer identity comes from session. If a time field is retained, it is informational in the MVP and must not imply a slot reservation unless slot-conflict logic is implemented.

Acceptance:
- Past dates rejected.
- Business and service existence/ownership relationship validated.
- Inactive business/service rejected.
- Token allocation atomic.
- Token unique by business and local queue date.
- Appointment stored with `waiting` status after successful booking (or `booked` only if a separate check-in step is explicitly implemented; choose one state model consistently).
- Response includes token, date, queue position, estimated wait, and appointment ID.
- Duplicate requests must not create duplicate bookings accidentally; support an idempotency key if practical, otherwise document retry behavior.

## F-05 Queue management

Owner actions:
- Get queue snapshot.
- Call next.
- Complete current.
- Mark eligible waiting appointment no-show.
- Pause/resume queue.

Acceptance:
- Only owner of business can mutate queue.
- Only one appointment can be `serving` for a business/date.
- Call next returns 409 if current serving appointment is not completed.
- Queue progression chooses the lowest token among eligible waiting appointments.
- State transition validated on server.
- Queue event emitted only after transaction commit.

## F-06 Customer appointment management

Acceptance:
- Customer sees only own appointments.
- Customer can cancel only their eligible appointment.
- Cancellation does not recycle token.
- Customer can view public queue state without seeing other customers' personal information.

## F-07 Real-time updates

Acceptance:
- Socket room is scoped to business ID and date.
- Joining a room does not grant access to private customer data.
- Events carry minimal data; clients refetch public snapshot.
- Reconnection triggers a fresh API read.
- Socket authorization/room-join validation prevents arbitrary private room access.

## F-08 Public queue screen

Show:
- Business name.
- Queue date and open/paused state.
- Current serving token or “Not serving anyone”.
- Number of waiting tokens.
- Next few waiting token numbers (configurable, default 5).
- Estimated wait label and explanatory note.

Do not show customer email, phone, full name, or appointment notes.

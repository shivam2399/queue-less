# User Flows

## 1. Customer registration and login

1. Visitor opens QueueLess.
2. Selects Sign up.
3. Enters name, email, password, and customer role.
4. Backend validates, hashes password, creates user, and sets session cookie.
5. Frontend redirects to customer home.
6. On later visits, frontend requests `/auth/me` and restores session.
7. Logout calls API and clears cookie.

Error states: invalid email, weak password, duplicate email, network error, inactive account, expired session.

## 2. Business owner onboarding

1. Visitor registers as `business_owner`.
2. Opens owner dashboard.
3. If no business exists, show onboarding empty state.
4. Owner enters business name, address, contact details, timezone, opening and closing times.
5. Backend creates business associated with authenticated owner.
6. Owner creates at least one service.
7. Business can be activated and appears in public discovery.

Do not let the client choose `ownerId`; derive it from authenticated identity.

## 3. Customer booking

1. Customer opens business discovery.
2. Searches or selects a business.
3. Views business details and active services.
4. Selects a service and date.
5. Sees booking summary and queue policy.
6. Confirms booking.
7. Backend validates business/service/date and transactionally allocates next token.
8. Backend returns appointment and token details.
9. Customer sees confirmation and queue tracking link.

If booking fails due to a concurrent request, show a retryable message and refetch queue state.

## 4. Owner queue operation

1. Owner logs in and opens dashboard.
2. Selects their business (MVP UI may show one business).
3. Sees today's waiting, serving, completed, and cancelled counts.
4. Owner calls next eligible waiting token.
5. Backend transactionally marks the previous serving appointment completed if policy requires explicit completion first; do not silently complete without a clear UI action.
6. Owner marks the current appointment as serving.
7. Owner completes or marks no-show.
8. Backend commits state and emits queue update.
9. Connected public displays and customers refresh their queue state.

MVP recommended interaction: separate `Call next` and `Complete current` actions. `Call next` must fail with a conflict if another appointment is still serving, unless an explicit override flow is implemented.

## 5. Public queue display

1. Visitor opens `/queue/[businessId]`.
2. Page fetches public queue snapshot.
3. Page displays current token, waiting count, and estimated wait.
4. Client joins business/date Socket.IO room.
5. On queue event, client updates or refetches snapshot.
6. On disconnect/reconnect, client refetches snapshot before trusting live events.

## 6. Empty and error states

Every list screen must define:
- Initial loading state.
- Empty state with a useful next action.
- Error state with retry.
- Permission denied state.
- Offline/reconnecting state where real-time data is used.

Never show fake success when an API request fails.

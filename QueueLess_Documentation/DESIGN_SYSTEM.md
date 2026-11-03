# QueueLess Design System

## 1. Design direction

**Visual concept:** Premium dark SaaS — calm, precise, operational, trustworthy.

The product should feel like a modern productivity tool, not a hospital management system. Use a restrained palette, clear hierarchy, generous spacing, subtle borders, and purposeful motion.

Avoid excessive gradients, glowing cards, glassmorphism everywhere, oversized marketing text inside dashboards, and decorative charts without meaning.

## 2. Brand

- Product: QueueLess
- Wordmark: `Queue` in foreground + `Less` in accent.
- Tone: helpful, direct, calm, reliable.
- Primary message: “Spend less time waiting.”
- Voice: concise and plain-language; avoid technical terms in customer-facing UI.

## 3. Color tokens

Use CSS variables and semantic tokens. Suggested dark palette:

| Token | Value | Use |
|---|---|---|
| background | `#09090B` | App background |
| surface | `#111318` | Cards and panels |
| surface-elevated | `#181B22` | Menus/dialogs |
| border | `#272B35` | Dividers and borders |
| foreground | `#F4F4F5` | Main text |
| muted | `#A1A1AA` | Secondary text |
| subtle | `#71717A` | Helper text |
| primary | `#3B82F6` | Primary actions/links |
| primary-hover | `#2563EB` | Hover |
| success | `#22C55E` | Completed/healthy |
| warning | `#F59E0B` | Paused/attention |
| danger | `#EF4444` | Errors/destructive |
| info | `#38BDF8` | Informational state |

Use semantic aliases rather than hardcoding colors in components. Ensure WCAG AA contrast for normal text where practical. Do not rely on color alone to communicate status.

## 4. Typography

Use Geist Sans (or system sans fallback) for UI. Use Geist Mono only for token numbers or technical values.

Type scale:
- Display: 36–48px, weight 600–700.
- Page title: 28–32px, weight 600.
- Section title: 18–20px, weight 600.
- Card title: 15–16px, weight 600.
- Body: 14–16px, weight 400.
- Supporting: 12–13px.
- Eyebrow/label: 11–12px, medium, letter spacing 0.04em.

Use sentence case. Avoid all-caps labels except tiny metadata.

## 5. Spacing and layout

Use a 4px base scale:
- 1 = 4px
- 2 = 8px
- 3 = 12px
- 4 = 16px
- 5 = 20px
- 6 = 24px
- 8 = 32px
- 10 = 40px
- 12 = 48px
- 16 = 64px

Dashboard:
- Desktop sidebar: 240–256px.
- Main content max width: 1440px.
- Page padding: 24–32px desktop; 16px mobile.
- Card radius: 12–16px.
- Input/button radius: 8–10px.
- Border: 1px subtle.
- Use consistent 16–24px card padding.

## 6. Components

### Buttons
- Primary: solid blue, white label.
- Secondary: surface with border.
- Ghost: transparent with hover surface.
- Destructive: red semantic style.
- Sizes: sm 32px, md 40px, lg 44–48px.
- Include disabled, loading, hover, focus-visible states.

### Inputs
- Height 40–44px.
- Visible label above input.
- Helpful placeholder, not a substitute for label.
- Error text directly below.
- Keyboard focus ring.
- Do not communicate errors using border color alone.

### Cards
- Surface background, subtle border, 12–16px radius.
- Avoid heavy shadows.
- Clear title, optional description, content and action hierarchy.

### Badges
- Use semantic statuses: Waiting, Serving, Completed, Cancelled, Paused.
- Include text labels and icons where useful.
- Keep badge colors restrained.

### Tables
- Use clear headers, row hover, aligned numeric values.
- Mobile: transform into cards or allow intentional horizontal scroll.
- Include loading skeleton, empty state, and pagination.

### Dialogs
- Use for destructive confirmation and focused forms.
- Escape closes unless an operation is actively submitting.
- Trap focus and restore focus.

### Toasts
- Use for brief action feedback.
- Persistent validation errors belong inline.
- Never rely solely on toast for critical booking confirmation.

## 7. Iconography

Use Lucide icons via `lucide-react`. Use consistent 16–20px icons for navigation and actions. Icons that are not universally understood must have visible labels or tooltips.

## 8. Motion

- 150–220ms transitions.
- Ease-out for entering; ease-in for exiting.
- Subtle hover and pressed feedback.
- Queue token changes may use a short fade/slide.
- Respect `prefers-reduced-motion`.
- Avoid animation that delays or obscures operational actions.

## 9. Responsive behavior

Breakpoints:
- Mobile: <640px.
- Tablet: 640–1023px.
- Desktop: >=1024px.

Mobile-first requirements:
- Navigation becomes drawer or compact top navigation.
- Primary actions remain reachable.
- Queue token is prominent.
- Forms use full-width controls.
- Tables become cards or scrollable regions.
- Avoid fixed-width dashboard layouts.

## 10. Accessibility

- Semantic HTML.
- Keyboard navigable controls.
- Visible focus states.
- Labels associated with fields.
- Dialog focus management.
- Sufficient contrast.
- Status conveyed with text, not color alone.
- Announce important queue changes politely via accessible live region; avoid announcing every minor refresh.

## 11. Queue-specific visual hierarchy

Customer queue page:
1. Business identity and queue date.
2. Current serving token — largest visual element.
3. Customer's own token and position.
4. Estimated waiting time with disclaimer.
5. Queue status and refresh/connection state.

Owner dashboard:
1. Business identity and open/paused status.
2. Primary queue action.
3. Current serving token.
4. Waiting list ordered by token.
5. Summary metrics.
6. Service management and settings.

## 12. Design QA checklist

- All pages use the same spacing, typography, and color tokens.
- No raw browser alerts for normal app flows.
- Every form has validation and submission state.
- Every list has loading, empty, error states.
- Destructive actions require confirmation.
- Mobile layout is tested at 360px and 390px widths.
- Keyboard focus is visible.
- Reduced motion is respected.

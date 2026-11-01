# Feature: events

## 1. Purpose
Tell a traveler what events, festivals and sales are on in a place during their dates (what, where, when).

## 2. Pages & routes
- `/events` (login required). Code: `features/events/`, `app/events/page.tsx`, `app/api/events/route.ts`, `lib/events/claude.ts`.

## 3. UI states
Form (where, from, to) → loading skeleton → cards (category, name, description, where, when, optional price range) + caveat; empty result shows a friendly message; error box with Try again.

## 4. Data
No mock data and nothing saved. Claude knowledge only; unsure dates are shown as the usual period.

## 5. Acceptance
- [x] Asks where and when.
- [x] Lists events with where and when, or says none are known.
- [x] All text in 10 languages.

## 6. SQL notes
None.

## 7. Server notes
`POST /api/events` (see `docs/plan.md` §5.3).

## 8. Status
Built, typechecks and builds. Not yet tried against the live Claude API.

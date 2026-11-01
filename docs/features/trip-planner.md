# Feature: trip-planner

## 1. Purpose
Help a traveler decide what to do: choose where and when, pick interests, see matching places plus events and sales during the trip, and optionally get a day-by-day plan.

## 2. Pages & routes
- `/trip-planner` (login required). Code: `features/trip-planner/`, `app/trip-planner/page.tsx`, `app/api/trip-planner/route.ts`, `lib/trip-planner/claude.ts`.

## 3. UI states
- Step 1: where + from/to dates (validated: place required, dates valid, not in the past, at most 30 days).
- Step 2: interest chips (multi-select, at least one).
- Loading skeleton → results: place cards (each with an "Include in my plan" checkbox), events/sales cards, caveat, "Make a plan?" Yes / No thanks.
- Yes → loading → numbered stops per day + tips. No → offer hidden.
- Error box with translated message and Try again.

## 4. Data
No mock data and nothing saved. Claude knowledge only (cannot browse), so events and sales are best-effort with a caveat.

## 5. Acceptance
- [x] Where/when, then interests, then suggestions with prices as "≈ X – Y".
- [x] Events and sales for the dates (may be empty, says so).
- [x] Plan covers every day of the range and orders stops by nearness.
- [x] All text in 10 languages.

## 6. SQL notes
None.

## 7. Server notes
`POST /api/trip-planner` modes `suggest` and `plan` (see `docs/plan.md` §5.4). Needs a logged-in user; `ANTHROPIC_API_KEY` as for trip-assistant.

## 8. Status
Built, typechecks and builds. Not yet tried against the live Claude API.

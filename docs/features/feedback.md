# Feature: feedback

## 1. Purpose
Let a signed-in user rate SmartTrip with one to five stars.

## 2. Pages & routes
No page of its own. A "Rate SmartTrip ★★★★★" bar sits at the bottom of `/trip-assistant`, `/trip-planner` and `/events`. Code: `features/feedback/`, mounted in `app/layout.tsx`; `POST /api/feedback`.

## 3. UI states
Idle stars (hover highlights) → saving (stars disabled) → "Thanks for your rating!" or a translated error. Rating again replaces the old rating.

## 4. Data
`feedback` table: one row per user per tool (`user_id`, `page`, `rating` 1–5). No comments.

## 5. Acceptance
- [x] Five-star rating on the three tool pages, text in 10 languages.
- [x] One rating per user per tool; re-rating updates it.

## 6. SQL notes
`sql/feedback.sql` — table, RLS (own rows only; insert/update/select), no access for anonymous. Run it in the Supabase SQL Editor. The owner reads all ratings in the dashboard.

## 7. Server notes
`POST /api/feedback` `{ page, rating }` → upsert on `(user_id, page)`. Login required.

## 8. Status
Built; typechecks and builds. SQL not yet run in Supabase, so saving fails until it is.

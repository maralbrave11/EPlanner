# Feature: admin

## 1. Purpose
Let the site owner see who uses SmartTrip and what they did, and control the site.

## 2. Pages & routes
- `/admin` (login + email in `ADMIN_EMAILS`; others see "not found"). Code: `features/admin/`, `app/admin/page.tsx`, `app/api/admin/route.ts`, `lib/admin/*`, `lib/supabase/admin.ts`.
- Site-wide parts: `app/_components/site-settings.tsx` (banner, tool switch gate) and an "Admin" link in the header shown to admins.

## 3. UI states
- Tabs **Users / Activity / Site**.
- Users: rating averages per tool, searchable table (email, joined, last sign-in, chats + deleted, actions, ratings, status). Click a row for the user page: block/unblock, delete user, ratings, conversations (expand to read messages; deleted ones marked in red), activity list.
- Activity: the latest 200 requests of everyone.
- Site: banner on/off + text, switches for chat / planner / events, Save.
- Loading, error ("is sql/admin.sql run?") and confirm dialogs for destructive actions.

## 4. Data
Reads and writes through the service role. No mock data.

## 5. Acceptance
- [x] Only ADMIN_EMAILS can open /admin or call /api/admin.
- [x] Admin sees users, conversations (including deleted), activity, ratings.
- [x] Block / unblock, delete user, delete conversation.
- [x] Banner and tool on/off, enforced by the server too.

## 6. SQL notes
`sql/admin.sql`: `assistant_conversations.deleted_at`, `user_flags`, `site_settings` (public read), `activity_log` (users insert own, only admin reads). Run after `trip-assistant.sql` and `feedback.sql`.

## 7. Server notes
- Env: `SUPABASE_SERVICE_ROLE_KEY` (Vercel + `.env.local`, never public), `ADMIN_EMAILS`.
- AI routes call `checkAccess` (blocked? tool off?) and `logActivity` from `lib/admin/guard.ts`. If the admin tables are missing they let requests through.
- Blocking also sets a Supabase sign-in ban (`ban_duration`).

## 8. Status
Built; typechecks and builds. Not yet tried against a live Supabase project (needs sql/admin.sql run and the two env vars).

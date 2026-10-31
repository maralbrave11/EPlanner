# 004 — Stack: serverless only

**Decision (2026-10-31):** Use only Next.js, Supabase, Vercel, and serverless functions.

- Server logic: Next.js Route Handlers / Server Actions → Vercel serverless functions.
- Database, auth, storage, caching (`provider_cache`): Supabase.
- Hosting and secrets: Vercel (Environment Variables); `.env.local` for local dev.
- No separate backend, long-running servers, Docker, or other databases/caches.
- Any new external service needs the owner's approval first.

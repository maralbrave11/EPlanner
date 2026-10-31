# Changelog

- 2026-10-31 — Project setup: moved plan to `docs/plan.md`, stage checklists to `docs/stages/`, added `CLAUDE.md`, `.gitignore`, `docs/README.md`.
- 2026-10-31 — Scaffolded base: Next.js 16 + Tailwind, Supabase clients (`lib/supabase`), session proxy, login/signup pages, landing page. Decision: UI language English.
- 2026-10-31 — Decision: stack limited to Next.js, Supabase, Vercel, serverless (`docs/decisions/004-stack.md`).
- 2026-10-31 — Decision: scope simplified to one feature `trip-assistant` (AI Q&A with recommendation + options, Claude). Old plan archived. Landing page CTA now points to `/trip-assistant`.
- 2026-10-31 — Decision: app is free, no daily question limit (`docs/decisions/006-free-no-limit.md`).
- 2026-10-31 — Fix (base): pages no longer crash when Supabase env vars are missing.
- 2026-10-31 — `trip-assistant` Stage 1 frontend done (mock answers): chat page, recommendation/option cards, follow-up, loading/error/not-found states, conversation sidebar. Branch `feature/trip-assistant`.
- 2026-10-31 — Stage 2: merged `feature/trip-assistant` into `main`; review fixes: site header with log in / log out, login returns to `?next=` page; added `sql/trip-assistant.sql`.
- 2026-10-31 — Stage 3: `POST /api/trip-assistant` (Claude claude-opus-5-5 → switched to claude-sonnet-5-5 for lower cost, structured output, saves to Supabase); frontend reads conversations from Supabase; login required for `/trip-assistant`; mock data removed. Decisions: login required, USD default. Fix: moved real keys out of `.env.example` into `.env.local`.

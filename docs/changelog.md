# Changelog

- 2026-10-31 — Project setup: moved plan to `docs/plan.md`, stage checklists to `docs/stages/`, added `CLAUDE.md`, `.gitignore`, `docs/README.md`.
- 2026-10-31 — Scaffolded base: Next.js 16 + Tailwind, Supabase clients (`lib/supabase`), session proxy, login/signup pages, landing page. Decision: UI language English.
- 2026-10-31 — Decision: stack limited to Next.js, Supabase, Vercel, serverless (`docs/decisions/004-stack.md`).
- 2026-10-31 — Decision: scope simplified to one feature `trip-assistant` (AI Q&A with recommendation + options, Claude). Old plan archived. Landing page CTA now points to `/trip-assistant`.
- 2026-10-31 — Decision: app is free, no daily question limit (`docs/decisions/006-free-no-limit.md`).

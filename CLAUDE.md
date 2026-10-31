# CLAUDE.md — SmartTrip (EPlanner)

Rules the AI assistant must follow in every session. Read `docs/plan.md` for the full spec.

## Project
- SmartTrip: a travel website where users ask questions and get AI recommendations with options, saving them money and time.
- Stack: Next.js (frontend + API routes), Supabase (auth + database), Vercel (hosting), Claude (AI answers, Stage 3 only).
- App: user asks a travel question → AI answers with one recommendation + 5–8 options (see `docs/plan.md` §5 for the answer format).
- Main spec: `docs/plan.md`. Feature specs: `docs/features/<feature-name>.md`. Stage checklists: `docs/stages/`.

## Stack Rule (strict)
- **Only use: Next.js, Supabase, Vercel, serverless.** No other platforms or services.
- Server code = Next.js Route Handlers / Server Actions, deployed as Vercel serverless functions. No separate backend, no long-running servers, no Docker, no cron servers.
- Data, auth, and storage = Supabase only (no other database, cache, or auth provider).
- Hosting = Vercel. Secrets live in `.env.local` locally and in Vercel Environment Variables in production.
- Ask the owner before adding any new external service or paid dependency.

## Naming Rule (strict)
- Every feature's directory, page route, doc file, SQL file, and branch name must **exactly match** the feature name.
- Feature names: `trip-assistant` (the only feature for now — see `docs/plan.md` §2).
- Never use a name that could be mistaken for another feature or for base code (e.g., no `assistant`, `trip-chat`, `ai-assistant` directories).

## Branches
- Never work directly on `main` for feature work. One branch per feature: `feature/<feature-name>`.
- Daily routine: update `docs/plan.md` → create a branch → check this file → start working. Log each change as one line in `docs/changelog.md`.

## Stage 1 — Frontend only (done for trip-assistant)
1. **Frontend only.** Do not touch server code, Supabase code, or SQL.
2. All frontend files for a feature live under `features/<feature-name>/`. Route files in `app/` only import from that directory.
3. **One feature at a time.** Don't touch anything outside the feature currently being built.
4. Use **mock data only** (kept inside `features/<feature-name>/`).
5. Before starting, ask: **"Which feature am I building?"** Then read `docs/plan.md`, confirm the scope, and wait for the owner's confirmation before generating code.
6. Fill in sections 1–5 of `docs/features/<feature-name>.md` (template in `docs/plan.md` §9.3).
7. When a feature is done, commit it on its branch and move to the next one.

## Stage 2 — Review & SQL (later)
- Merge all feature branches into `main`, review and fix everything.
- SQL only, in `sql/<feature-name>.sql`. No server functionality, no extra features.

## Stage 3 — Server (later)
- Ask: "Which feature's server should I build?" Read the frontend, the SQL, and `docs/plan.md`.
- Minimal, merge-friendly changes. One feature at a time. Never touch other features' code or prompts.
- Test, then commit.

## Price display (all stages)
- Prices are always shown as an estimated range ("≈ X – Y"), never a single guaranteed number.

## Tech notes
- Next.js 16 (App Router, TypeScript, Tailwind v4). APIs differ from older versions: read `node_modules/next/dist/docs/` before using unfamiliar APIs (see `AGENTS.md`).
  - Middleware is now `proxy.ts`. `cacheComponents` is on: runtime data (`cookies()`, `headers()`) must sit inside `<Suspense>`.
- UI language: **English**.
- Base (not feature work): `app/login`, `app/signup`, `app/_components/auth-form.tsx`, `lib/supabase/*`, `proxy.ts`.

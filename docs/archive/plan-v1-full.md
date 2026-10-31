# Development Plan — SmartTrip (working name)

> Status: Draft v1 — to be finalized by the project owner before Stage 1 begins.
> Stack: **only** Next.js (frontend + API routes as serverless functions), Supabase (auth + database), and Vercel (hosting). No other platforms or servers. Base project with login/signup and Supabase connection is set up.

---

## 1. App Overview

**App name:** SmartTrip (working name, can be changed)

**One-line pitch:** A website that helps people save money and time when traveling by asking the right questions and building a personalized, continuously improving trip plan.

**What it does:**

1. Asks the user **where** they want to go, **when**, and **what** they want to do or see.
2. Builds a day-by-day **itinerary** based on the answers.
3. Suggests **comfortable, reasonably priced hotels** along the route, with several alternatives.
4. Finds **events, activities, and store discounts** at the destination during the exact travel dates, and asks the user whether to include them. If the user agrees, a **new itinerary is generated**.
5. Provides **public transportation / rideshare information** for getting around (buses, trains, metro, shared rides).
6. Keeps **asking follow-up questions**, analyzes the answers, and **updates the plan** until the user is satisfied.

**Target users:** Budget-conscious travelers and anyone who wants a well-organized trip without spending hours researching.

**Core principle:** Save the user's **money** and **time**. Every suggestion should show price and/or time impact.

**Pricing approach:** The app shows **estimated price ranges** ("about X – Y"), not exact live prices. This keeps the app fast, free of external API dependencies at launch, and honest about accuracy. Exact live prices from external providers can be added later (see Section 6).

---

## 2. Feature List

Each feature name is also its directory name (see Naming Rule in `CLAUDE.md`).

| # | Feature name (directory) | Description |
|---|---|---|
| 1 | `trip-questionnaire` | Multi-step form that collects destination, dates, budget, interests, travelers, and travel style. |
| 2 | `itinerary` | Displays the generated day-by-day plan (places, timings, estimated costs). |
| 3 | `hotels` | Lists 3–5 hotel options per stay location, with an estimated price range, rating, location, and a comparison view. |
| 4 | `deals` | Shows events, festivals, activities, and store discounts (from a verified, curated list) that overlap with the travel dates; the user accepts or rejects each. |
| 5 | `transport` | Shows transportation options between and within destinations (bus, train, metro, shared rides) with an estimated price range and duration range. |
| 6 | `smart-followup` | Asks follow-up questions, collects feedback on the plan, and triggers plan regeneration. |
| 7 | `trip-history` | Lists the user's saved trips and plan versions. |

Existing from base project (not part of feature work): login, signup, Supabase connection.

---

## 3. Pages

| Route | Feature | Short description |
|---|---|---|
| `/` | — | Landing page: value proposition and a "Plan my trip" button. |
| `/login`, `/signup` | base | Authentication (already provided). |
| `/trip-questionnaire` | `trip-questionnaire` | Step-by-step questions: where, when, what to do/see, budget, number of people. |
| `/itinerary/[tripId]` | `itinerary` | The current plan, day by day, with total estimated cost and time. Shows plan version. |
| `/hotels/[tripId]` | `hotels` | Hotel alternatives for each stop, filter by price/rating/distance, pick one per stop. |
| `/deals/[tripId]` | `deals` | Cards for discovered events and discounts. Each card has "Add to plan" / "Skip". Confirming triggers a new itinerary version. |
| `/transport/[tripId]` | `transport` | Transport options per leg of the route, sorted by price or duration. |
| `/smart-followup/[tripId]` | `smart-followup` | Chat-style or card-style follow-up questions ("Do you prefer fewer transfers?", "Is this hotel too far from the center?"). Answers update the plan. |
| `/trip-history` | `trip-history` | All saved trips and previous plan versions. |

---

## 4. User Flow

1. User signs up / logs in.
2. User fills in `trip-questionnaire`.
3. System generates the first itinerary → `itinerary`.
4. User reviews hotels → `hotels`.
5. System shows deals/events for the exact dates → `deals`. User accepts or rejects.
6. If any deal is accepted, a **new itinerary version** is generated.
7. User checks transport options → `transport`.
8. `smart-followup` keeps asking clarifying questions. Each answer is analyzed and the plan is refreshed.
9. Final plan is saved to `trip-history`.

---

## 5. Database (Supabase / PostgreSQL) — designed in Stage 2

Not built in Stage 1 (Stage 1 uses mock data only). The database stores **user data and choices**, plus **reference data** (price estimates and curated deals) that powers the plan.

### 5.1 Tables

**User data**

| Table | Purpose | Key columns |
|---|---|---|
| `trips` | One row per trip | `id`, `user_id` (→ auth.users), `title`, `destination`, `start_date`, `end_date`, `travelers`, `budget_amount`, `budget_currency`, `status` (draft / active / completed), `current_version_id`, `created_at`, `updated_at` |
| `trip_preferences` | Answers from the questionnaire | `trip_id`, `interests` (text[]), `travel_style`, `pace`, `hotel_level` (budget / mid / comfort), `max_transfers`, `answers` (jsonb) |
| `itinerary_versions` | Every generated plan version | `id`, `trip_id`, `version_number`, `reason` (initial / deal_accepted / followup_answer), `content` (jsonb: days, stops, timings), `est_cost_min`, `est_cost_max`, `est_minutes_min`, `est_minutes_max`, `created_at` |
| `hotel_options` | Hotels shown/selected for a stop | `id`, `trip_id`, `version_id`, `stop_label`, `name`, `price_min`, `price_max`, `currency`, `price_type` (estimate / live), `rating`, `lat`, `lng`, `booking_url`, `price_updated_at`, `is_selected` |
| `deals` | Events and discounts offered to a trip | `id`, `trip_id`, `curated_deal_id` (→ curated_deals), `status` (suggested / accepted / rejected), `created_at` |
| `transport_options` | Transport options per route leg | `id`, `trip_id`, `leg_index`, `mode` (bus / train / metro / rideshare), `price_min`, `price_max`, `currency`, `price_type`, `duration_min`, `duration_max`, `info_url`, `is_selected` |
| `followup_questions` | Follow-up questions and answers | `id`, `trip_id`, `question`, `options` (jsonb), `answer` (jsonb), `created_at`, `answered_at` |

**Reference data (maintained by the owner / admin)**

| Table | Purpose | Key columns |
|---|---|---|
| `price_estimates` | Estimated price and duration ranges | `id`, `destination`, `category` (hotel / meal / transport / activity), `level` (budget / mid / comfort), `season` (low / high / peak), `price_min`, `price_max`, `currency`, `duration_min`, `duration_max`, `confidence` (low / medium / high), `source`, `updated_at` |
| `curated_deals` | Verified events and discounts | `id`, `destination`, `type` (event / discount), `title`, `description`, `location`, `starts_on`, `ends_on`, `discount_text`, `source_url`, `verified_at`, `is_active` |
| `provider_cache` | Short-lived cache of live provider responses (used only after Phase B, Section 6.1) | `cache_key` (PK), `provider`, `payload` (jsonb), `fetched_at`, `expires_at` |

Optional: `profiles` (`user_id`, `display_name`, `preferred_language`, `preferred_currency`).

### 5.2 Relations

```
auth.users     1 ── n trips
trips          1 ── 1 trip_preferences
trips          1 ── n itinerary_versions
trips          1 ── n hotel_options / deals / transport_options / followup_questions
curated_deals  1 ── n deals
```

`price_estimates` is looked up by (`destination`, `category`, `level`, `season`) when a plan or option is generated.

### 5.3 Rules

- **Row Level Security (RLS)** on every user table: a user can only read and write rows whose trip belongs to them (`trips.user_id = auth.uid()`).
- **Reference tables** (`price_estimates`, `curated_deals`): readable by signed-in users; writable only by the owner/admin (service role).
- `provider_cache` has **no user access**; only the server reads and writes it.
- **Snapshot principle:** when a user selects a hotel, accepts a deal, or picks a transport option, the item is saved with its price range and `price_updated_at`. `trip-history` stays consistent even if estimates are updated later.
- Itinerary versions are never overwritten; every change creates a new version.
- SQL files: `sql/<feature-name>.sql` (e.g., `sql/hotels.sql`). Shared tables (`trips`, `trip_preferences`) go in `sql/trip-questionnaire.sql`. Reference tables go with the feature that uses them (`price_estimates` → `sql/hotels.sql` and `sql/transport.sql` as needed, `curated_deals` → `sql/deals.sql`).

---

## 6. Server Notes (for Stage 3 — not built earlier)

### 6.1 Two-phase data strategy

**Decision:** start with estimates, add live data later.

**Phase A — Estimates (launch version)**
- Prices and durations come from the owner's own `price_estimates` table and are shown as **ranges** ("≈ 80,000 – 150,000 MNT per night").
- Events and discounts come from the `curated_deals` table: a small, hand-verified list for supported destinations and dates.
- No external APIs, no partner approvals, no provider downtime. The app stays fast and predictable.
- Total trip cost is calculated as a range: sum of all minimums to sum of all maximums.
- Estimates are built from manual research and public information. AI may draft a first version, but a human must verify it before it goes into the table. Unverified AI prices are never shown to users.
- Review estimates on a regular schedule (suggested: every 3 months, and before peak seasons).

**Phase B — Live data (later, optional)**
- Add official provider APIs (hotels, events/discounts, transport). Most require registration and an API key; some need partner approval. Scraping websites is **not** used.
- Each data type has a normalized interface and one adapter per provider: `lib/providers/hotels/estimate.ts` (Phase A), `lib/providers/hotels/<provider>.ts` (Phase B), same for `deals` and `transport`. The estimate source is simply the first provider, so adding live providers does not change the rest of the app.
- Provider calls run server-side only; API keys live in `.env.local` (local) and Vercel Environment Variables (production).
- Query providers in parallel with a timeout. If a provider fails, fall back to the estimate.
- Cache responses in `provider_cache` for a short time (starting values: hotels 15 min, transport 10 min, deals 60 min), within each provider's terms of use.
- Live results are marked `price_type = live` and show a "last updated" time.

### 6.2 Plan generation and analysis

- An AI model is called from server-side API routes (serverless functions on Vercel; key in Vercel Environment Variables) to build the itinerary and to analyze questionnaire and follow-up answers.
- The AI composes plans **using the numbers from `price_estimates`** and deals from `curated_deals`; it does not invent prices.
- Every accepted deal or follow-up answer creates a new `itinerary_versions` row; old versions stay available.
- Follow-up questions are generated from what is still unknown or from signals in earlier answers (e.g., user rejected a far hotel → ask about distance tolerance).

### 6.3 Price display rules

- Always show prices as a **range** with an "estimated" label (e.g., "≈ X – Y"), never as a single guaranteed number.
- Show when the estimate was last reviewed (`updated_at`).
- Add a short note near booking links: "Final price may differ on the booking site."
- Deals and events show their source link and verification date (`verified_at`). Expired deals (`ends_on` in the past) are never shown.
- Currency is displayed in the user's chosen currency; conversion rate and date are noted if conversion is used.
- Low-confidence estimates are visually marked (e.g., "rough estimate").

---

## 7. Open Questions (owner to decide)

1. Primary UI language: Mongolian, English, or both?
2. Which regions/countries are supported first?
3. ~~How to get hotel prices, events, and discounts?~~ **Decided: estimated price ranges first (Phase A), live provider APIs later (Phase B)** — see Section 6.1. Still open: which provider APIs to use in Phase B.
4. Currency handling (MNT, USD, local currency)?
5. Will hotel booking happen on this site, or does the user only get recommendations and links?
6. Who collects and maintains the data in `price_estimates` and `curated_deals` (the owner, a partner, or both), and which destinations are covered first?
7. How will estimates be sourced and verified (manual research, public data, AI draft + human check)?

---

## 8. Development Stages (summary)

| Stage | Goal | Rules |
|---|---|---|
| **1 — Frontend only** | Build the UI for each feature, one at a time, under `features/<feature-name>/`. | No server code, no Supabase code, no SQL. Branch per feature: `feature/<name>`. |
| **2 — Review & SQL** | Merge all feature branches into `main`, review everything, then build SQL in `sql/<feature-name>.sql`. | SQL only. No server functionality. No extra features. Run SQL in your own Supabase SQL Editor and verify tables. |
| **3 — Server** | Build the server for one feature at a time with minimal changes. | AI reads frontend + SQL + this plan. Test, commit, move to next feature. |

**Daily routine:** update `docs/plan.md` → create a branch → check `CLAUDE.md` → start working.

**Suggested build order:** `trip-questionnaire` → `itinerary` → `hotels` → `deals` → `transport` → `smart-followup` → `trip-history`.

---

## 9. Documentation Structure

### 9.1 Project layout

```
smarttrip/
├── CLAUDE.md                  # Rules the AI reads every session
├── .gitignore
├── docs/                      # All documentation
├── features/                  # Stage 1: frontend, one directory per feature
│   ├── trip-questionnaire/
│   ├── itinerary/
│   ├── hotels/
│   ├── deals/
│   ├── transport/
│   ├── smart-followup/
│   └── trip-history/
├── sql/                       # Stage 2: <feature-name>.sql (database)
├── lib/providers/             # Stage 3: data adapters (estimate first, live providers later)
└── app/                       # Next.js routes (base + feature pages)
```

### 9.2 `docs/` layout

```
docs/
├── README.md                  # Index of all docs: what is where
├── plan.md                    # Main development plan (this file)
├── changelog.md               # Daily changes and short decision log
│
├── features/                  # One file per feature (same name as the feature)
│   ├── trip-questionnaire.md
│   ├── itinerary.md
│   ├── hotels.md
│   ├── deals.md
│   ├── transport.md
│   ├── smart-followup.md
│   └── trip-history.md
│
├── stages/                    # Checklist for each stage
│   ├── stage-1-frontend.md
│   ├── stage-2-review-sql.md
│   └── stage-3-server.md
│
├── data/                      # Filled in during Stage 2
│   ├── schema.md              # Tables, relations, RLS rules (see Section 5)
│   └── price-estimates.md     # How estimates are collected, verified, and refreshed
│
├── integrations/              # Filled in during Stage 3 / Phase B
│   ├── hotels-provider.md     # Chosen API, auth, limits, response mapping
│   ├── deals-provider.md
│   └── transport-provider.md
│
├── api/                       # Filled in during Stage 3
│   ├── overview.md            # AI calls, auth, error format
│   └── <feature-name>.md      # Endpoints for each feature
│
└── decisions/                 # Record of important decisions
    ├── 001-data-sources.md    # Two-phase decision: estimates first, live providers later
    ├── 002-language-currency.md
    └── 003-booking-scope.md
```

### 9.3 Feature document template (`docs/features/<feature-name>.md`)

```
# <feature-name>

## 1. Purpose         – What problem it solves and the value for the user
## 2. Pages & routes  – Pages, routes, directory (features/<feature-name>/)
## 3. UI states       – Loading, empty, error, success
## 4. Mock data       – Temporary data used in Stage 1
## 5. Acceptance      – Checklist that defines "done"
## 6. SQL notes       – (Stage 2) Tables used
## 7. Server notes    – (Stage 3) Endpoints, AI prompts, external APIs
## 8. Status          – Not started / In progress / Done + branch name
```

Sections 1–5 are filled in during Stage 1, section 6 during Stage 2, and section 7 during Stage 3. This way each feature document grows with the stages, and the AI can read the full scope of a feature from a single file.

### 9.4 How to use the docs

- `plan.md` is the overview; `features/*.md` hold the detailed specification of each feature.
- Daily routine: update `plan.md` → create a branch → check `CLAUDE.md` → start working. Record each change as one line in `changelog.md`.
- Whenever a decision is made, add a short file to `decisions/`. Answers to the open questions in Section 7 are recorded there.
- Feature file names must exactly match the feature names listed in Section 2 (Naming Rule in `CLAUDE.md`).

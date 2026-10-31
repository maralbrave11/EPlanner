# Development Plan — SmartTrip (working name)

> Status: v2 — simplified to a single AI Q&A feature (2026-10-31). The original 7-feature plan is kept in `docs/archive/plan-v1-full.md`.
> Stack: **only** Next.js (frontend + API routes as serverless functions), Supabase (auth + database), and Vercel (hosting). AI: Claude (Anthropic API). No other platforms or servers.

---

## 1. App Overview

**App name:** SmartTrip (working name)

**One-line pitch:** Ask any travel question and get a clear AI recommendation plus a few options to choose from, so you save money and time.

**What it does:**

1. The user types a travel question (e.g., "Where should I stay in Tokyo for 3 nights on a mid budget?", "How do I get from the airport to the city?", "What can I do in Ulaanbaatar in winter?").
2. The AI answers with:
   - **One recommendation**: the best choice for this user, with a short reason why.
   - **2–4 options**: alternatives, each with a short description, an **estimated price range**, and pros/cons.
   - Optionally, **one follow-up question** to make the next answer better (e.g., "Do you prefer being close to the center or saving money?").
3. The user can click an option (or answer the follow-up) to continue the conversation; the AI refines its recommendation.
4. Signed-in users' conversations are saved so they can come back to them.

**Target users:** Budget-conscious travelers and anyone who wants quick, clear travel decisions without hours of research.

**Core principle:** Save the user's **money** and **time**. Every recommendation and option shows price and/or time impact.

**Pricing approach:** Prices are always **estimated ranges** ("≈ X – Y"), never a single guaranteed number, with a note that real prices may differ.

---

## 2. Feature List

Each feature name is also its directory name (see Naming Rule in `CLAUDE.md`).

| # | Feature name (directory) | Description |
|---|---|---|
| 1 | `trip-assistant` | Chat page: user asks a question; AI replies with a recommendation card, option cards, and an optional follow-up question. Includes the list of the user's past conversations. |

Existing from base project (not part of feature work): landing page, login, signup, Supabase connection.

---

## 3. Pages

| Route | Feature | Short description |
|---|---|---|
| `/` | — | Landing page: value proposition and an "Ask a travel question" button. |
| `/login`, `/signup` | base | Authentication. |
| `/trip-assistant` | `trip-assistant` | New conversation: question box + example questions. |
| `/trip-assistant/[conversationId]` | `trip-assistant` | An existing conversation with its messages; sidebar lists past conversations. |

---

## 4. User Flow

1. User opens the site and clicks "Ask a travel question" (login required to save conversations).
2. User types a question and sends it.
3. AI reply appears: recommendation card → option cards → optional follow-up question.
4. User clicks an option ("Tell me more about this") or answers the follow-up, or types a new question.
5. AI refines the recommendation. Repeat until the user is satisfied.
6. The conversation is saved and appears in the sidebar.

---

## 5. AI Answer Format

Every AI reply follows this structure (the frontend renders it; in Stage 1 it is mock data):

```json
{
  "summary": "Short plain-language answer (1–2 sentences).",
  "recommendation": {
    "title": "Stay in Shinjuku",
    "reason": "Best transport links for a 3-night first visit, mid-range prices.",
    "price": { "min": 90, "max": 150, "currency": "USD", "unit": "per night" }
  },
  "options": [
    {
      "title": "Asakusa",
      "description": "Traditional area, quieter, cheaper.",
      "price": { "min": 60, "max": 110, "currency": "USD", "unit": "per night" },
      "pros": ["Cheaper", "Historic sights"],
      "cons": ["Farther from nightlife"]
    }
  ],
  "followUpQuestion": "Do you prefer nightlife or a quieter area?"
}
```

`price` and `followUpQuestion` are optional (not every question involves a price).

---

## 6. Database (Supabase / PostgreSQL) — designed in Stage 2

Not built in Stage 1 (Stage 1 uses mock data only).

| Table | Purpose | Key columns |
|---|---|---|
| `assistant_conversations` | One row per conversation | `id`, `user_id` (→ auth.users), `title`, `created_at`, `updated_at` |
| `assistant_messages` | Every question and answer | `id`, `conversation_id`, `role` (user / assistant), `content` (text, user question), `answer` (jsonb, AI answer in the format of Section 5), `created_at` |

Relations: `auth.users 1 ── n assistant_conversations 1 ── n assistant_messages`.

Rules:
- **RLS** on both tables: a user can only read/write their own conversations (`user_id = auth.uid()`) and their messages.
- SQL file: `sql/trip-assistant.sql`.

---

## 7. Server Notes (Stage 3 — not built earlier)

- One Next.js Route Handler (Vercel serverless function), e.g. `app/api/trip-assistant/route.ts`, receives the question + recent conversation history, calls **Claude** (Anthropic API), and returns the answer in the Section 5 format.
- `ANTHROPIC_API_KEY` lives in `.env.local` (local) and Vercel Environment Variables (production). Never exposed to the browser.
- The system prompt tells Claude to: always give one recommendation + 2–4 options, show prices only as estimated ranges, say when it is unsure, and ask a follow-up question when key info (dates, budget, travelers) is missing.
- Structured output (JSON) so the frontend can render cards reliably.
- The route saves the question and answer to Supabase.
- Exact Claude model is chosen in Stage 3 (check current models and pricing then).

### Price display rules
- Always "≈ X – Y" with an "estimated" label. Never a single guaranteed number.
- Short note under answers: "Prices are estimates and may differ."

---

## 8. Open Questions (owner to decide)

1. ~~Primary UI language~~ **Decided: English.**
2. Default currency (USD, MNT, or user's choice)?
3. Can guests (not logged in) ask questions, or is login required?
4. ~~Daily question limit~~ **Decided: free, no daily limit** (see `decisions/006-free-no-limit.md`).

---

## 9. Development Stages (summary)

| Stage | Goal | Rules |
|---|---|---|
| **1 — Frontend only** | Build the `trip-assistant` UI under `features/trip-assistant/` with mock answers. | No server code, no Supabase code, no SQL. Branch: `feature/trip-assistant`. |
| **2 — Review & SQL** | Merge into `main`, review everything, build `sql/trip-assistant.sql`. | SQL only. Run it in your Supabase SQL Editor and verify tables. |
| **3 — Server** | Build the Claude route + saving to Supabase with minimal changes. | Read frontend + SQL + this plan. Test, commit. |

**Daily routine:** update `docs/plan.md` → create a branch → check `CLAUDE.md` → start working.

---

## 10. Documentation Structure

```
docs/
├── README.md               # Index of all docs
├── plan.md                 # This file
├── changelog.md            # Daily changes and decisions
├── features/
│   └── trip-assistant.md   # Feature spec (template below)
├── stages/                 # Checklist per stage
├── decisions/              # Important decisions
└── archive/                # Old plan versions
```

Feature document template (`docs/features/trip-assistant.md`): 1. Purpose · 2. Pages & routes · 3. UI states (loading, empty, error, success) · 4. Mock data · 5. Acceptance · 6. SQL notes (Stage 2) · 7. Server notes (Stage 3) · 8. Status.

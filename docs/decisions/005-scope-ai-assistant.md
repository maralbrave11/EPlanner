# 005 — Scope: single AI Q&A feature

**Decision (2026-10-31):** The app is simplified to one feature, `trip-assistant`: the user asks a travel question, and the AI (Claude, Anthropic API) answers with one recommendation + 2–4 options with estimated price ranges, plus an optional follow-up question.

- The original 7-feature plan (questionnaire, itinerary, hotels, deals, transport, smart-followup, trip-history) is archived in `docs/archive/plan-v1-full.md` and can be revisited later.
- Claude is called only from a Vercel serverless function (Stage 3); the API key never reaches the browser.

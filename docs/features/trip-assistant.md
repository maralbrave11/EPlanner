# trip-assistant

## 1. Purpose
Users ask any travel question and get one clear **recommendation** plus **5–8 options** (up to 10 for things to see or do) with estimated price ranges and pros/cons, so they can decide quickly and save money and time. An optional follow-up question helps the next answer fit better.

## 2. Pages & routes
| Route | File | What it shows |
|---|---|---|
| `/trip-assistant` | `app/trip-assistant/page.tsx` → `NewConversation` | Empty state: title, example questions, question box |
| `/trip-assistant/[conversationId]` | `app/trip-assistant/[conversationId]/page.tsx` → `ConversationView` | Messages, AI answer cards, follow-up, question box |

- Shared layout `app/trip-assistant/layout.tsx` mounts `TripAssistantProvider` so conversations stay in memory while navigating.
- All feature code lives in `features/trip-assistant/`:
  - `types.ts`: answer format (matches `docs/plan.md` §5)
  - `mock-data.ts`, `mock-assistant.ts`: Stage 1 mock answers
  - `trip-assistant-provider.tsx`: conversations, loading, error and retry state
  - `format-price.ts`: "≈ $X – $Y per …" formatting
  - `components/`: `answer-card`, `question-input`, `conversation-sidebar`, `trip-assistant-shell`, `new-conversation`, `conversation-view`

## 3. UI states
- **Empty:** `/trip-assistant` shows example questions; sidebar shows "No conversations yet." when the list is empty.
- **Loading:** "Finding the best options for you…" while waiting; input and option buttons are disabled.
- **Error:** red alert with the message and a **Try again** button (retries the same question).
- **Success:** summary → recommendation card (highlighted) → option cards (price, pros/cons, "Tell me more") → follow-up question with **Answer** button → "Prices are estimates and may differ."
- **Sidebar scrolling:** on desktop the conversation list stays in place under the header and scrolls on its own, so it does not move with the answers. On phones it sits above the chat and its list scrolls inside a small box.
- **Delete:** each conversation in the sidebar has a trash button (always visible on touch screens, on hover or focus on desktop). It asks for confirmation, removes the conversation and its messages from Supabase (RLS: own rows only), and leaves the page if that conversation was open.
- **Input box:** sits at the end of the conversation (not pinned), so it never covers answers while scrolling.
- **Not found:** unknown conversation id shows "Conversation not found" with a link to ask a new question.
- Option cards stay clickable on the latest options answer (so users can explore other places); route offer buttons only on the latest answer.

- **Login required:** logged-out visitors to `/trip-assistant*` are redirected to `/login?next=…` and come back after logging in.

## 4. Mock data
Removed in Stage 3. Only `example-questions.ts` (four starter questions) remains.

## 5. Acceptance
- [x] Landing page "Ask a travel question" → `/trip-assistant`
- [x] Clicking an example or typing a question creates a conversation and opens `/trip-assistant/<id>`
- [x] Loading state appears, then the answer with recommendation + options + follow-up
- [x] Prices always shown as estimated ranges, never a single number
- [x] "Tell me more" shows details about that place only (e.g. stores and brands in an outlet), then offers a visiting order; "Yes, plan my route" shows numbered steps, "No thanks" hides the offer
- [x] "Answer" focuses the input for the follow-up question
- [x] Error state with working "Try again"
- [x] Sidebar lists conversations, highlights the active one, and navigation keeps state
- [x] Not-found state for unknown ids
- [x] Works on mobile (sidebar stacks above the chat)
- [x] `npm run build`, `tsc`, and `npm run lint` pass; tested in a real browser (headless Edge)

## 6. SQL notes
- Tables: `assistant_conversations` (id, user_id, title, created_at, updated_at) and `assistant_messages` (id, conversation_id, role, content, answer jsonb, created_at). File: `sql/trip-assistant.sql`.
- Conversation id is generated in the browser so the page can navigate before the answer arrives.
- RLS: users only see/change their own conversations and messages; anonymous visitors have no access. Messages cannot be edited (insert/select/delete only).
- Trigger: inserting a message bumps the conversation `updated_at` (sidebar order).

## 7. Server notes
- **Endpoint:** `POST /api/trip-assistant` (`app/api/trip-assistant/route.ts`, Vercel serverless, `maxDuration = 60`).
  - Body: `{ conversationId: uuid, question: string (1–2000 chars) }` → `{ answer, saved }` or `{ error }`.
  - 400 bad input · 401 not logged in · 422 Claude declined · 429 busy · 500 config/database · 502 Claude error.
  - Flow: check user → load last 20 messages (RLS) → ask Claude → save conversation (if new), question, answer. Saving happens only after a successful answer, so "Try again" never duplicates messages.
- **Claude call:** `lib/trip-assistant/claude.ts` (server-only). Three modes via the `mode` body field: `ask` (options), `detail` (about one `topic`), `route` (visiting order for `topic`); each has its own prompt and zod schema.
  - Model `claude-sonnet-5-5`, effort `medium`, structured output via zod schema (matches `types.ts`).
  - `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`): if a safety classifier declines, Anthropic retries on its recommended fallback model.
  - System prompt: one recommendation + 5–8 options (up to 10 for things to see or do), prices only as ranges (USD by default), null price when not relevant, follow-up question when key info is missing, today's date for seasons.
- **Reads in the browser:** the conversation list and messages come straight from Supabase with the anon key (RLS limits rows to the user).
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY` (server only).

## 8. Status
Stage 3 code done (branch `feature/trip-assistant`, merged to `main`). End-to-end test with a real user pending: needs the SQL run in Supabase and `ANTHROPIC_API_KEY` set.

## 9. Languages
- All text shown in the feature comes from `lib/i18n/messages/<language>.ts` (`useI18n().t(key)`); prices use the language's number format.
- The browser sends `language` in the API request; Claude writes every text field in that language. Old saved answers stay in the language they were written in.
- API errors return a `code` (`err.<code>` keys) so the message appears in the user's language.
- Quirk: the text sent as the user's message ("Tell me more about …") is saved in the language used at that moment.

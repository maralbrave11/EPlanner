# trip-assistant

## 1. Purpose
Users ask any travel question and get one clear **recommendation** plus **2–4 options** with estimated price ranges and pros/cons, so they can decide quickly and save money and time. An optional follow-up question helps the next answer fit better.

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
- **Not found:** unknown conversation id shows "Conversation not found" with a link to ask a new question.
- Only the latest answer has interactive buttons; older answers are read-only.

## 4. Mock data
- Two saved conversations (`mock-tokyo`, `mock-ulaanbaatar`) and four example questions.
- `pickMockAnswer` picks an answer by keywords: stay/hotel → neighborhoods, airport/train/bus → transport, do/see/winter → activities, otherwise a general answer.
- Mock delay: 1.2 s. **To preview the error state, include the word "error" in a question.**
- Nothing is saved: refreshing the page resets to the mock conversations.

## 5. Acceptance
- [x] Landing page "Ask a travel question" → `/trip-assistant`
- [x] Clicking an example or typing a question creates a conversation and opens `/trip-assistant/<id>`
- [x] Loading state appears, then the answer with recommendation + options + follow-up
- [x] Prices always shown as estimated ranges, never a single number
- [x] "Tell me more" sends a follow-up question; "Answer" focuses the input for the follow-up
- [x] Error state with working "Try again"
- [x] Sidebar lists conversations, highlights the active one, and navigation keeps state
- [x] Not-found state for unknown ids
- [x] Works on mobile (sidebar stacks above the chat)
- [x] `npm run build`, `tsc`, and `npm run lint` pass; tested in a real browser (headless Edge)

## 6. SQL notes
(Stage 2)

## 7. Server notes
(Stage 3) Replace `askMockAssistant` with a call to the trip-assistant API route (Claude, server-side); load and save conversations from Supabase instead of `MOCK_CONVERSATIONS`.

## 8. Status
Stage 1 done. Branch: `feature/trip-assistant`.

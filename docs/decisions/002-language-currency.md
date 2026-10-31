# 002 — Language & currency

- **Language (updated 2026-10-31):** The app supports **10 languages** with a language picker in the header:
  English (default), Mongolian, Chinese, Hindi, Spanish, French, Arabic, Portuguese, Russian, Japanese.
  - The first visit uses the browser language if it is one of these, otherwise English. The choice is saved in the browser.
  - Buttons, labels and error messages come from `lib/i18n/messages/<code>.ts`.
  - The AI (Claude) writes its answers in the selected language.
  - Arabic is shown right-to-left.
  - Add a language: add it to `lib/i18n/languages.ts`, copy `messages/en.ts` to `messages/<code>.ts` and translate it, register it in `messages/index.ts`. The build fails if any step is missing.
  - UI translations were written by AI; have a native speaker review them before launch.
- **Currency:** USD by default; the AI uses another currency if the user asks.

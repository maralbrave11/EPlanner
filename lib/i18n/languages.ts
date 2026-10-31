// Supported languages. Order = order in the language picker.
// 10 languages: widely spoken worldwide and useful for travelers, plus Mongolian.
// Pure data (no React) so both server code and client code can import it.
// To add a language: add it here, add `messages/<code>.ts` (copy en.ts) and register it in
// `messages/index.ts`. TypeScript fails the build if any of the three is missing.

export const LANGUAGES = [
  { code: "en", native: "English", ai: "English", dir: "ltr", locale: "en-US" },
  { code: "mn", native: "Монгол", ai: "Mongolian (Cyrillic script)", dir: "ltr", locale: "mn-MN" },
  { code: "zh", native: "中文", ai: "Simplified Chinese", dir: "ltr", locale: "zh-CN" },
  { code: "hi", native: "हिन्दी", ai: "Hindi", dir: "ltr", locale: "hi-IN" },
  { code: "es", native: "Español", ai: "Spanish", dir: "ltr", locale: "es-ES" },
  { code: "fr", native: "Français", ai: "French", dir: "ltr", locale: "fr-FR" },
  { code: "ar", native: "العربية", ai: "Arabic", dir: "rtl", locale: "ar" },
  { code: "pt", native: "Português", ai: "Portuguese", dir: "ltr", locale: "pt-BR" },
  { code: "ru", native: "Русский", ai: "Russian", dir: "ltr", locale: "ru-RU" },
  { code: "ja", native: "日本語", ai: "Japanese", dir: "ltr", locale: "ja-JP" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [LanguageCode, ...LanguageCode[]];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export function getLanguage(code: string) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && LANGUAGES.some((l) => l.code === value);
}

"use client";

// Language state for the whole app.
// - Saved in localStorage; the first visit uses the browser language if we support it.
// - Server and first client render both use English, then the real language is applied
//   (useSyncExternalStore avoids hydration mismatches).
// - Sets <html lang> and <html dir> (Arabic is right-to-left).

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_LANGUAGE, getLanguage, isLanguageCode, type LanguageCode } from "./languages";
import { MESSAGES, type MessageKey } from "./messages";

const STORAGE_KEY = "smarttrip-language";
const listeners = new Set<() => void>();

function readLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLanguageCode(saved)) return saved;
  } catch {
    // localStorage can be blocked (private mode); fall through to the browser language.
  }
  const browser = (navigator.language || "").toLowerCase().split("-")[0];
  return isLanguageCode(browser) ? browser : DEFAULT_LANGUAGE;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // another tab changed the language
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

type Params = Record<string, string | number>;

type I18nContextValue = {
  lang: LanguageCode;
  /** BCP 47 locale for Intl number/date formatting, e.g. "mn-MN". */
  locale: string;
  dir: "ltr" | "rtl";
  setLanguage: (code: LanguageCode) => void;
  /** Translate a key; `{name}` placeholders are filled from `params`. */
  t: (key: MessageKey, params?: Params) => string;
  /** Translate an API error code (see err.* keys); undefined if the code is unknown. */
  tError: (code: string | undefined) => string | undefined;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLanguage, () => DEFAULT_LANGUAGE);
  const { dir, locale } = getLanguage(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLanguage = useCallback((code: LanguageCode) => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Not saved, but the switch below still works for this visit.
    }
    listeners.forEach((l) => l());
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const messages = MESSAGES[lang];
    const t = (key: MessageKey, params?: Params) => {
      const text = messages[key] ?? MESSAGES.en[key];
      return params ? text.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`)) : text;
    };
    const tError = (code: string | undefined) => {
      const key = `err.${code}` as MessageKey;
      return code && key in messages ? t(key) : undefined;
    };
    return { lang, locale, dir, setLanguage, t, tError };
  }, [lang, locale, dir, setLanguage]);

  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

"use client";

// Shows an AI answer in the language the user has picked now, translating it
// (via POST /api/translate) when it was written in another language.
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { postJson } from "./post-json";
import { collectStrings, replaceStrings } from "./translate-strings";

type Store<T> = { source: T | null; byLang: Record<string, T> };

/**
 * @param value    the answer as received (null before there is one)
 * @param written  language code the answer was written in
 * @returns `shown` = the answer to render, `translating` = a translation is on its way
 */
export function useTranslated<T>(value: T | null, written: string) {
  const { lang } = useI18n();
  const [store, setStore] = useState<Store<T>>({ source: null, byLang: {} });
  const [busy, setBusy] = useState<string | null>(null);
  const requested = useRef<{ source: T | null; langs: Set<string> }>({ source: null, langs: new Set() });

  const needsTranslation = value !== null && lang !== written;
  const cached = store.source === value ? store.byLang[lang] : undefined;

  useEffect(() => {
    if (!needsTranslation || value === null || cached) return;
    if (requested.current.source !== value) requested.current = { source: value, langs: new Set() };
    if (requested.current.langs.has(lang)) return;
    requested.current.langs.add(lang);
    const strings = collectStrings(value);
    setBusy(lang);
    void (async () => {
      try {
        const res = await postJson<{ strings: string[] }>("/api/translate", { strings, language: lang });
        if (res.strings.length !== strings.length) throw new Error("length mismatch");
        const translated = replaceStrings(value, res.strings);
        setStore((prev) => ({
          source: value,
          byLang: { ...(prev.source === value ? prev.byLang : {}), [lang]: translated },
        }));
      } catch {
        requested.current.langs.delete(lang); // try again the next time the language changes
      } finally {
        setBusy((b) => (b === lang ? null : b));
      }
    })();
  }, [needsTranslation, value, cached, lang]);

  return {
    shown: needsTranslation ? (cached ?? value) : value,
    translating: needsTranslation && !cached && busy === lang,
  };
}

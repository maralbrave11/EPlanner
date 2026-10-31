"use client";

import { useI18n } from "@/lib/i18n/i18n-provider";
import { isLanguageCode, LANGUAGES } from "@/lib/i18n/languages";

/** Language picker. A native <select> works well on phones and with screen readers. */
export function LanguageSwitcher() {
  const { lang, setLanguage, t } = useI18n();

  return (
    <label className="relative flex items-center">
      <span className="sr-only">{t("lang.label")}</span>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute start-2.5 h-4 w-4 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
      </svg>
      <select
        value={lang}
        onChange={(e) => {
          if (isLanguageCode(e.target.value)) setLanguage(e.target.value);
        }}
        className="h-8 max-w-36 cursor-pointer appearance-none rounded-full border border-line bg-surface ps-8 pe-3 text-sm font-medium outline-none transition hover:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/15"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}

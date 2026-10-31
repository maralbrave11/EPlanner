"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/i18n-provider";

const STEPS = [1, 2, 3] as const;
const EXAMPLES = ["ex.1", "ex.2", "ex.3"] as const;

/** Landing page body. Client component because the text depends on the chosen language. */
export function HomeContent() {
  const { t } = useI18n();

  return (
    <main className="flex flex-1 flex-col">
      <section className="hero-glow">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 pt-20 pb-16 text-center sm:pt-28">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            {t("home.badge")}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {t("home.title1")}
            <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text pb-1 text-transparent">
              {t("home.title2")}
            </span>
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted">{t("home.subtitle")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/trip-assistant"
              className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3 font-medium text-white shadow-lg shadow-emerald-600/20 transition hover:shadow-xl hover:shadow-emerald-600/30"
            >
              {t("home.cta")}
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full border border-line bg-surface px-7 py-3 font-medium hover:border-emerald-500"
            >
              {t("home.howLink")}
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-4xl px-6 py-14">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
          {t("home.howTitle")}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((n) => (
            <li key={n} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {n}
              </span>
              <h3 className="font-semibold">{t(`home.step${n}Title`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`home.step${n}Text`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 pb-20">
        <h2 className="mb-4 text-center text-sm font-semibold tracking-wide text-muted uppercase">
          {t("home.tryAsking")}
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((key) => (
            <Link
              key={key}
              href="/trip-assistant"
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              {t(key)}
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-line px-6 py-6 text-center text-xs text-muted">
        {t("home.footer")}
      </footer>
    </main>
  );
}

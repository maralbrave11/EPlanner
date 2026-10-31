"use client";

import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { RouteAnswer } from "../types";

/** Reply to "Yes, plan my route": numbered visiting order with tips. */
export function RouteCard({ answer }: { answer: RouteAnswer }) {
  const { t } = useI18n();
  const { title, summary, steps, totalMinutes, tips } = answer;

  function formatMinutes(total: number) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    const key: MessageKey = h === 0 ? "time.min" : m === 0 ? "time.h" : "time.hmin";
    return t(key, { n: h === 0 ? m : h, h, m });
  }

  return (
    <div className="rise-in flex flex-col gap-4">
      <section className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-surface to-surface p-5 shadow-sm dark:border-emerald-800 dark:from-emerald-950 rtl:bg-gradient-to-bl">
        <span className="mb-2 inline-flex rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
          {t("route.badge")}
        </span>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{summary}</p>
        {totalMinutes !== undefined && (
          <p className="mt-3 text-sm font-medium">
            {t("route.total", { time: formatMinutes(totalMinutes) })}
          </p>
        )}
      </section>

      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li
            key={`${i}-${step.name}`}
            className="flex gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h4 className="font-semibold">{step.name}</h4>
                {step.minutes !== undefined && (
                  <span className="text-xs text-muted">~{formatMinutes(step.minutes)}</span>
                )}
              </div>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{step.why}</p>
              {step.tip && (
                <p className="mt-1.5 text-sm text-emerald-800 dark:text-emerald-300">
                  {t("route.tip", { tip: step.tip })}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {tips.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4 text-sm shadow-sm">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span aria-hidden className="text-emerald-600">
                •
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

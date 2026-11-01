"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-provider";

const PAGES = ["trip-assistant", "trip-planner", "events"] as const;
type Page = (typeof PAGES)[number];

/** "Rate SmartTrip" with five stars. Shown at the bottom of the three tool pages. */
export function RatingWidget() {
  const pathname = usePathname();
  const page = PAGES.find((p) => pathname === `/${p}` || pathname.startsWith(`/${p}/`));
  return page ? <Stars key={page} page={page} /> : null;
}

function Stars({ page }: { page: Page }) {
  const { t, tError } = useI18n();
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  async function rate(value: number) {
    setRating(value);
    setStatus("saving");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, rating: value }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { code?: string } | null;
        setErrorText(tError(data?.code) ?? tError("generic") ?? "");
        setStatus("error");
        return;
      }
      setStatus("saved");
    } catch {
      setErrorText(tError("network") ?? "");
      setStatus("error");
    }
  }

  const shown = hover || rating;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-line bg-surface/60 px-4 py-3 text-sm">
      <span className="text-muted">{t("fb.title")}</span>
      <div role="group" aria-label={t("fb.title")} className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={status === "saving"}
            aria-label={t("fb.stars", { n })}
            aria-pressed={rating === n}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => void rate(n)}
            className={`p-0.5 text-2xl leading-none transition disabled:opacity-50 ${
              n <= shown ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {status === "saved" && (
        <span role="status" className="text-emerald-700 dark:text-emerald-300">
          {t("fb.thanks")}
        </span>
      )}
      {status === "error" && (
        <span role="alert" className="text-rose-700 dark:text-rose-300">
          {errorText}
        </span>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { FeatureNav } from "@/app/_components/feature-nav";
import {
  PlaceDatesFields,
  placeDatesError,
  type PlaceDates,
} from "@/app/_components/place-dates-fields";
import { ApiError, postJson } from "@/lib/ai/post-json";
import { useTranslated } from "@/lib/ai/use-translated";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { PriceTag } from "@/features/trip-assistant/components/answer-card";
import type { EventsAnswer } from "../types";

type State =
  | { status: "form" }
  | { status: "loading" }
  | { status: "done"; answer: EventsAnswer; destination: string; written: string }
  | { status: "error"; message: string; code?: string };

/** /events — ask where and when, then list the events on during those dates. */
export function EventsPage() {
  const { t, tError, lang } = useI18n();
  const [value, setValue] = useState<PlaceDates>({ destination: "", startDate: "", endDate: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: "form" });

  async function search() {
    const problem = placeDatesError(value);
    if (problem) {
      setFormError(t(problem));
      return;
    }
    setFormError(null);
    setState({ status: "loading" });
    try {
      const answer = await postJson<EventsAnswer>("/api/events", { ...value, language: lang });
      setState({ status: "done", answer, destination: value.destination.trim(), written: lang });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
        code: err instanceof ApiError ? err.code : "generic",
      });
    }
  }

  // If the language is switched after the search, show the answer in the new language.
  const { shown, translating } = useTranslated(
    state.status === "done" ? state.answer : null,
    state.status === "done" ? state.written : lang,
  );
  const busy = state.status === "loading";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="max-w-sm">
        <FeatureNav />
      </div>

      <div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-2xl shadow-md">🎟️</span>
          {t("ev.title")}
        </h1>
        <p className="mt-2 text-muted">{t("ev.subtitle")}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm"
      >
        <PlaceDatesFields value={value} onChange={setValue} />
        {formError && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="self-start rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
        >
          {t("ev.search")}
        </button>
      </form>

      {state.status === "loading" && (
        <div role="status" className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {t("ev.loading")}
          </p>
          <div className="skeleton h-24 rounded-2xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
        >
          <span className="flex-1">{tError(state.code) ?? state.message}</span>
          <button
            type="button"
            onClick={() => void search()}
            className="rounded-md bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700"
          >
            {t("view.tryAgain")}
          </button>
        </div>
      )}

      {state.status === "done" && shown && (
        <div className="rise-in flex flex-col gap-4">
          {translating && (
            <p role="status" className="text-xs text-muted">
              {t("view.translating")}
            </p>
          )}
          <h2 className="text-xl font-semibold tracking-tight">
            {t("ev.resultsTitle", { place: state.destination })}
          </h2>
          <p className="text-[15px] leading-relaxed text-pretty">{shown.summary}</p>

          {shown.events.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
              {t("ev.none")}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {shown.events.map((event) => (
                <article
                  key={`${event.name}-${event.when}`}
                  className="lift flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-sm"
                >
                  <span className="self-start rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-sky-800 uppercase dark:bg-sky-950 dark:text-sky-200">
                    {event.category}
                  </span>
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm leading-relaxed text-muted">{event.description}</p>
                  <dl className="grid gap-1 text-sm">
                    <div>
                      <dt className="inline text-xs font-semibold tracking-wide text-muted uppercase">
                        {t("item.where")}:{" "}
                      </dt>
                      <dd className="inline">{event.where}</dd>
                    </div>
                    <div>
                      <dt className="inline text-xs font-semibold tracking-wide text-muted uppercase">
                        {t("item.when")}:{" "}
                      </dt>
                      <dd className="inline">{event.when}</dd>
                    </div>
                  </dl>
                  <p className="text-sm">
                    <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                      {t("ev.moreInfo")}:{" "}
                    </span>
                    {event.moreInfo}
                  </p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${event.name} ${state.destination}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start text-sm font-medium text-emerald-700 underline dark:text-emerald-300"
                  >
                    {t("ev.searchOnline")} ↗
                  </a>
                  {event.price && (
                    <div>
                      <PriceTag price={event.price} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          <p className="text-xs text-muted">{shown.caveat}</p>
        </div>
      )}
    </div>
  );
}

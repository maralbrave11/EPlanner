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
import {
  INTEREST_IDS,
  type InterestId,
  type PlanAnswer,
  type SuggestionsAnswer,
} from "../types";

type Step = "where" | "interests" | "results";
type Pending = "suggest" | "plan" | null;
type Failure = { message: string; code?: string; retry: () => void };

const HAPPENING_STYLE = {
  event: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  festival: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  sale: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
} as const;

const primaryButton =
  "rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md disabled:opacity-50";
const secondaryButton =
  "rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:border-emerald-500 disabled:opacity-50";

/** /trip-planner — where and when → interests → suggestions + events/sales → optional day-by-day plan. */
export function TripPlannerPage() {
  const { t, tError, lang } = useI18n();
  const [step, setStep] = useState<Step>("where");
  const [trip, setTrip] = useState<PlaceDates>({ destination: "", startDate: "", endDate: "" });
  const [interests, setInterests] = useState<ReadonlySet<InterestId>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionsAnswer | null>(null);
  const [chosen, setChosen] = useState<ReadonlySet<number>>(new Set()); // indexes into places
  const [suggestionsLang, setSuggestionsLang] = useState(lang);
  const [planLang, setPlanLang] = useState(lang);
  const [planDeclined, setPlanDeclined] = useState(false);
  const [plan, setPlan] = useState<PlanAnswer | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  // If the language is switched after the answers arrive, show them in the new language.
  const translatedSuggestions = useTranslated(suggestions, suggestionsLang);
  const translatedPlan = useTranslated(plan, planLang);
  const shownSuggestions = translatedSuggestions.shown;
  const shownPlan = translatedPlan.shown;
  const translating = translatedSuggestions.translating || translatedPlan.translating;

  function fail(err: unknown, retry: () => void) {
    setFailure({
      message: err instanceof Error ? err.message : "Something went wrong.",
      code: err instanceof ApiError ? err.code : "generic",
      retry,
    });
  }

  function next() {
    const problem = placeDatesError(trip);
    if (problem) {
      setFormError(t(problem));
      return;
    }
    setFormError(null);
    setStep("interests");
  }

  function toggleInterest(id: InterestId) {
    setFormError(null);
    setInterests((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  async function suggest() {
    if (interests.size === 0) {
      setFormError(t("pl.pickInterest"));
      return;
    }
    setFormError(null);
    setFailure(null);
    setPending("suggest");
    try {
      const answer = await postJson<SuggestionsAnswer>("/api/trip-planner", {
        mode: "suggest",
        ...trip,
        destination: trip.destination.trim(),
        interests: [...interests],
        language: lang,
      });
      setSuggestions(answer);
      setChosen(new Set(answer.places.map((_, i) => i))); // all included by default
      setSuggestionsLang(lang);
      setPlan(null);
      setPlanDeclined(false);
      setStep("results");
    } catch (err) {
      fail(err, () => void suggest());
    } finally {
      setPending(null);
    }
  }

  async function makePlan() {
    if (!shownSuggestions) return;
    const places = shownSuggestions.places.filter((_, i) => chosen.has(i)).map((p) => p.title);
    if (places.length === 0) {
      setFormError(t("pl.pickPlace"));
      return;
    }
    setFormError(null);
    setFailure(null);
    setPending("plan");
    try {
      const answer = await postJson<PlanAnswer>("/api/trip-planner", {
        mode: "plan",
        ...trip,
        destination: trip.destination.trim(),
        places,
        happenings: shownSuggestions.happenings.map((h) => `${h.name} (${h.when}, ${h.where})`),
        language: lang,
      });
      setPlan(answer);
      setPlanLang(lang);
    } catch (err) {
      fail(err, () => void makePlan());
    } finally {
      setPending(null);
    }
  }

  function startOver() {
    setStep("where");
    setInterests(new Set());
    setSuggestions(null);
    setPlan(null);
    setPlanDeclined(false);
    setFormError(null);
    setFailure(null);
  }

  function toggleChosen(index: number) {
    setFormError(null);
    setChosen((prev) => {
      const copy = new Set(prev);
      if (copy.has(index)) copy.delete(index);
      else copy.add(index);
      return copy;
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="max-w-sm">
        <FeatureNav />
      </div>

      <div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-2xl shadow-md">🗺️</span>
          {t("pl.title")}
        </h1>
        <p className="mt-2 text-muted">{t("pl.subtitle")}</p>
      </div>

      {step === "where" && (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">{t("pl.step1")}</p>
          <PlaceDatesFields value={trip} onChange={setTrip} />
          {formError && (
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              {formError}
            </p>
          )}
          <button type="button" onClick={next} className={`${primaryButton} self-start`}>
            {t("form.next")}
          </button>
        </section>
      )}

      {step === "interests" && (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">{t("pl.step2")}</p>
          <div>
            <h2 className="text-lg font-semibold">{t("pl.interestsTitle")}</h2>
            <p className="text-sm text-muted">{t("pl.interestsHint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {INTEREST_IDS.map((id) => {
              const on = interests.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  disabled={pending !== null}
                  onClick={() => toggleInterest(id)}
                  className={`rounded-full border px-4 py-2 text-sm transition disabled:opacity-50 ${
                    on
                      ? "border-emerald-600 bg-emerald-600 font-medium text-white"
                      : "border-line hover:border-emerald-500"
                  }`}
                >
                  {t(`int.${id}`)}
                </button>
              );
            })}
          </div>
          {formError && (
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
              {formError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => setStep("where")}
              className={secondaryButton}
            >
              {t("form.back")}
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void suggest()}
              className={primaryButton}
            >
              {t("pl.suggest")}
            </button>
          </div>
        </section>
      )}

      {step === "results" && shownSuggestions && (
        <div className="rise-in flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pl.resultsTitle", { place: trip.destination.trim() })}
            </h2>
            <button type="button" onClick={startOver} className={secondaryButton}>
              {t("form.startOver")}
            </button>
          </div>
          <p className="text-[15px] leading-relaxed text-pretty">{shownSuggestions.summary}</p>

          {/* Places */}
          <section>
            <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
              {t("pl.placesTitle")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {shownSuggestions.places.map((place, index) => {
                const on = chosen.has(index);
                return (
                  <article
                    key={place.title}
                    className={`lift flex flex-col gap-2 rounded-2xl border bg-surface p-4 shadow-sm ${
                      on ? "border-emerald-400" : "border-line"
                    }`}
                  >
                    <h4 className="font-semibold">{place.title}</h4>
                    <p className="text-sm leading-relaxed text-muted">{place.description}</p>
                    <p className="text-xs text-muted">{place.matches}</p>
                    <p className="text-sm">
                      <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                        {t("ev.moreInfo")}:{" "}
                      </span>
                      {place.moreInfo}
                    </p>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${place.title} ${trip.destination.trim()}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start text-sm font-medium text-emerald-700 underline dark:text-emerald-300"
                    >
                      {t("ev.searchOnline")} ↗
                    </a>
                    {place.price && (
                      <div>
                        <PriceTag price={place.price} />
                      </div>
                    )}
                    <ul className="flex flex-col gap-1 text-sm">
                      {place.pros.map((pro) => (
                        <li key={pro} className="text-green-800 dark:text-green-300">
                          + {pro}
                        </li>
                      ))}
                      {place.cons.map((con) => (
                        <li key={con} className="text-rose-700 dark:text-rose-300">
                          − {con}
                        </li>
                      ))}
                    </ul>
                    {!plan && !planDeclined && (
                      <label className="mt-auto flex items-center gap-2 pt-1 text-sm">
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={pending !== null}
                          onChange={() => toggleChosen(index)}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        {t("pl.include")}
                      </label>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          {/* Events and sales during the trip */}
          <section>
            <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
              {t("pl.happeningsTitle")}
            </h3>
            {shownSuggestions.happenings.length === 0 ? (
              <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
                {t("pl.noHappenings")}
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {shownSuggestions.happenings.map((h) => (
                  <li
                    key={`${h.name}-${h.when}`}
                    className="lift flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-4 shadow-sm"
                  >
                    <span
                      className={`self-start rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${HAPPENING_STYLE[h.kind]}`}
                    >
                      {t(`hap.${h.kind}`)}
                    </span>
                    <h4 className="font-semibold">{h.name}</h4>
                    <p className="text-sm leading-relaxed text-muted">{h.description}</p>
                    <p className="text-sm">
                      <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                        {t("item.where")}:{" "}
                      </span>
                      {h.where}
                    </p>
                    <p className="text-sm">
                      <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                        {t("item.when")}:{" "}
                      </span>
                      {h.when}
                    </p>
                    <p className="text-sm">
                      <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                        {t("ev.moreInfo")}:{" "}
                      </span>
                      {h.moreInfo}
                    </p>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${h.name} ${trip.destination.trim()}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start text-sm font-medium text-emerald-700 underline dark:text-emerald-300"
                    >
                      {t("ev.searchOnline")} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-xs text-muted">{shownSuggestions.caveat}</p>

          {/* Offer a plan */}
          {!plan && !planDeclined && (
            <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950">
              <p className="min-w-48 flex-1 text-sm leading-relaxed text-sky-900 dark:text-sky-100">
                {shownSuggestions.planQuestion}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => void makePlan()}
                  className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
                >
                  {t("pl.planYes")}
                </button>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => setPlanDeclined(true)}
                  className="rounded-full border border-sky-300 px-4 py-1.5 text-sm font-medium transition hover:bg-sky-100 disabled:opacity-50 dark:border-sky-800 dark:hover:bg-sky-900"
                >
                  {t("pl.planNo")}
                </button>
              </div>
              {formError && (
                <p role="alert" className="basis-full text-sm text-rose-700 dark:text-rose-300">
                  {formError}
                </p>
              )}
            </section>
          )}
        </div>
      )}

      {/* The plan */}
      {shownPlan && (
        <section className="rise-in flex flex-col gap-4">
          <div className="rounded-2xl border border-sky-200 bg-surface p-5 shadow-sm dark:border-sky-900">
            <span className="mb-2 inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-sky-800 uppercase dark:bg-sky-950 dark:text-sky-200">
              {t("pl.planBadge")}
            </span>
            <h3 className="text-xl font-semibold tracking-tight">{shownPlan.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{shownPlan.summary}</p>
          </div>

          {shownPlan.days.map((day) => (
            <article
              key={`${day.title}-${day.date ?? ""}`}
              className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
            >
              <h4 className="mb-3 font-semibold">
                {day.title}
                {day.date && <span className="ms-2 text-sm font-normal text-muted">{day.date}</span>}
              </h4>
              <ol className="flex flex-col gap-3">
                {day.stops.map((stop, i) => (
                  <li key={`${stop.name}-${i}`} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                      {i + 1}
                    </span>
                    <div className="text-sm">
                      <p className="font-medium">
                        {stop.name}
                        {stop.time && <span className="ms-2 font-normal text-muted">{stop.time}</span>}
                      </p>
                      <p className="leading-relaxed text-muted">{stop.note}</p>
                      {stop.minutes != null && (
                        <p className="text-xs text-muted">{t("pl.minutes", { n: stop.minutes })}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          ))}

          {shownPlan.tips.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4 text-sm shadow-sm">
              <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                {t("pl.tips")}
              </h4>
              <ul className="flex list-disc flex-col gap-1 ps-5">
                {shownPlan.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted">{t("pl.planNote")}</p>
        </section>
      )}

      {translating && (
        <p role="status" className="text-xs text-muted">
          {t("view.translating")}
        </p>
      )}

      {pending && (
        <div role="status" className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {pending === "plan" ? t("pl.loadingPlan") : t("view.finding")}
          </p>
          <div className="skeleton h-24 rounded-2xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
          </div>
        </div>
      )}

      {failure && !pending && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
        >
          <span className="flex-1">{tError(failure.code) ?? failure.message}</span>
          <button
            type="button"
            onClick={failure.retry}
            className="rounded-md bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700"
          >
            {t("view.tryAgain")}
          </button>
        </div>
      )}
    </div>
  );
}

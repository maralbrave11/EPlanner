"use client";

import { useI18n } from "@/lib/i18n/i18n-provider";

export type PlaceDates = { destination: string; startDate: string; endDate: string };

const MAX_TRIP_DAYS = 30;

/** Local calendar date as YYYY-MM-DD (not UTC, so "today" is right for the traveler). */
export function todayText() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Returns an i18n key describing what is wrong, or null when the value is usable. */
export function placeDatesError(v: PlaceDates): "form.errPlace" | "form.errDates" | null {
  if (!v.destination.trim()) return "form.errPlace";
  if (!v.startDate || !v.endDate) return "form.errDates";
  const start = Date.parse(v.startDate);
  const end = Date.parse(v.endDate);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "form.errDates";
  if (v.startDate < todayText()) return "form.errDates"; // past dates (checked on submit, not while rendering)
  if ((end - start) / 86_400_000 >= MAX_TRIP_DAYS) return "form.errDates";
  return null;
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15";

/** "Where" + "from / to" inputs shared by the trip-planner and events pages. */
export function PlaceDatesFields({
  value,
  onChange,
}: {
  value: PlaceDates;
  onChange: (next: PlaceDates) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium">{t("form.where")}</span>
        <input
          type="text"
          maxLength={100}
          value={value.destination}
          onChange={(e) => onChange({ ...value, destination: e.target.value })}
          placeholder={t("form.wherePh")}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t("form.from")}</span>
        <input
          type="date"
          value={value.startDate}
          onChange={(e) => {
            const startDate = e.target.value;
            // Keep the end date from falling before the start date.
            const endDate = value.endDate && value.endDate < startDate ? startDate : value.endDate;
            onChange({ ...value, startDate, endDate });
          }}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t("form.to")}</span>
        <input
          type="date"
          min={value.startDate || undefined}
          value={value.endDate}
          onChange={(e) => onChange({ ...value, endDate: e.target.value })}
          className={inputClass}
        />
      </label>
    </div>
  );
}

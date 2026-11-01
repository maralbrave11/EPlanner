// Shared request fields for the trip-planner and events routes (where + when + language).
import { z } from "zod";
import { LANGUAGE_CODES } from "@/lib/i18n/languages";

const MAX_TRIP_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const DateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Fields every request has. The date range must be valid and at most 30 days. */
export const TripInputShape = {
  destination: z.string().trim().min(1).max(100),
  startDate: DateText,
  endDate: DateText,
  language: z.enum(LANGUAGE_CODES).default("en"),
};

export function validDateRange(b: { startDate: string; endDate: string }) {
  const start = Date.parse(b.startDate);
  const end = Date.parse(b.endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return end >= start && (end - start) / DAY_MS < MAX_TRIP_DAYS;
}

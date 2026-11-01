// Server-only: trip-planner prompts (docs/plan.md §5.4). Never import from client code.
import "server-only";

import { z } from "zod";
import type { PriceRange } from "@/features/trip-assistant/types";
import type { PlanAnswer, SuggestionsAnswer } from "@/features/trip-planner/types";
import { callClaude, SHARED_RULES } from "@/lib/ai/call-claude";
import type { LanguageCode } from "@/lib/i18n/languages";

const PriceSchema = z.object({
  min: z.number(),
  max: z.number(),
  currency: z.string().describe("ISO 4217 code, e.g. USD"),
  unit: z.string().nullable().describe('e.g. "per person", or null'),
});

const SuggestSchema = z.object({
  summary: z.string().describe("1-2 sentences about what fits this traveler on these dates."),
  places: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      matches: z.string().describe("Which of the traveler's interests this fits."),
      moreInfo: z.string().describe("Where the traveler can get more details: official website owner, ticket seller, or the local tourism board. Name the source; only give a web address if you are sure of it."),
      price: PriceSchema.nullable(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    }),
  ),
  happenings: z.array(
    z.object({
      name: z.string(),
      kind: z.enum(["event", "sale", "festival"]),
      where: z.string(),
      when: z.string().describe("Date, or the usual period if unsure of the exact day."),
      description: z.string(),
      moreInfo: z.string().describe("Where the traveler can get more details: official website owner, ticket seller, or the local tourism board. Name the source; only give a web address if you are sure of it."),
    }),
  ),
  caveat: z.string(),
  planQuestion: z.string(),
});

const PlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  days: z.array(
    z.object({
      title: z.string().describe('Short day title, e.g. "Day 1: Old town".'),
      date: z.string().nullable().describe("YYYY-MM-DD for that day, or null."),
      stops: z.array(
        z.object({
          name: z.string(),
          time: z.string().nullable().describe('Start time or part of the day, e.g. "09:00" or "Morning".'),
          note: z.string().describe("Why it is at this point in the day and how to get there from the previous stop."),
          minutes: z.number().nullable().describe("Rough time to spend there."),
        }),
      ),
    }),
  ),
  tips: z.array(z.string()),
});

const SUGGEST_PROMPT = `${SHARED_RULES}

The traveler gave a destination, dates and interests. Suggest what suits them.
- places: 5-8 real, different places or activities that match the interests, ordered from most to least relevant. Each has a short description, which interests it matches, moreInfo (the best place to read more or book: official site owner, ticket seller, or local tourism board; never invent a URL), an estimated price range (or null), pros and cons. Never pad with near-duplicates.
- happenings: events, festivals, and shop or seasonal sales that you are reasonably sure take place there during or around these dates (0-6 items; empty if you know of none). kind is "event", "festival" or "sale". Each also has moreInfo (where to read more or buy tickets; never invent a URL).
- caveat: one honest sentence that events, sales, hours and prices change and must be checked on official websites.
- planQuestion: one friendly sentence asking whether they would like a day-by-day plan for these dates.`;

const PLAN_PROMPT = `${SHARED_RULES}

The traveler said yes to a day-by-day plan. Build it from the places they chose (and, where it fits, the events/sales listed).
- Use ONLY the chosen places and listed happenings. Do not add new places you are unsure about.
- Order stops so travel between them is short: group places that are near each other, go to one place, then the next nearest, and so on. Say in each note how to get from the previous stop.
- Fit the number of days exactly: one entry in days per calendar day from the start date to the end date. Do not overload a day (3-5 stops). Put an event or sale on the day it happens when the date is known.
- Each stop has a time (or part of the day), a note, and rough minutes (or null).
- tips: 2-4 practical tips (transport, best time to go, saving money).`;

function toPrice(p: z.infer<typeof PriceSchema> | null): PriceRange | undefined {
  if (!p) return undefined;
  const [min, max] = p.min <= p.max ? [p.min, p.max] : [p.max, p.min];
  return { min, max, currency: p.currency.toUpperCase(), unit: p.unit ?? undefined };
}

type Trip = { destination: string; startDate: string; endDate: string };

export async function askSuggestions(
  trip: Trip,
  interests: string[],
  language: LanguageCode,
): Promise<SuggestionsAnswer> {
  const raw = await callClaude(
    SuggestSchema,
    SUGGEST_PROMPT,
    `Destination: ${trip.destination}\nDates: ${trip.startDate} to ${trip.endDate}\nInterests: ${interests.join(", ")}`,
    language,
    "planner:suggest",
  );
  return {
    summary: raw.summary,
    places: raw.places.slice(0, 10).map((p) => ({
      title: p.title,
      description: p.description,
      matches: p.matches,
      moreInfo: p.moreInfo,
      price: toPrice(p.price),
      pros: p.pros,
      cons: p.cons,
    })),
    happenings: raw.happenings.slice(0, 8),
    caveat: raw.caveat,
    planQuestion: raw.planQuestion,
  };
}

export async function askPlan(
  trip: Trip,
  places: string[],
  happenings: string[],
  language: LanguageCode,
): Promise<PlanAnswer> {
  const raw = await callClaude(
    PlanSchema,
    PLAN_PROMPT,
    `Destination: ${trip.destination}\nDates: ${trip.startDate} to ${trip.endDate}\nChosen places:\n${places.map((p) => `- ${p}`).join("\n")}\nEvents and sales that may fit:\n${happenings.length ? happenings.map((h) => `- ${h}`).join("\n") : "- none"}`,
    language,
    "planner:plan",
  );
  return {
    title: raw.title,
    summary: raw.summary,
    days: raw.days.map((d) => ({
      title: d.title,
      date: d.date ?? undefined,
      stops: d.stops.map((s) => ({
        name: s.name,
        time: s.time ?? undefined,
        note: s.note,
        minutes: s.minutes ?? undefined,
      })),
    })),
    tips: raw.tips,
  };
}

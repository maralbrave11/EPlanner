// Server-only: asks Claude for events and happenings in a place and time (docs/plan.md §5.3).
import "server-only";

import { z } from "zod";
import type { EventsAnswer } from "@/features/events/types";
import type { PriceRange } from "@/features/trip-assistant/types";
import { callClaude, SHARED_RULES } from "@/lib/ai/call-claude";
import type { LanguageCode } from "@/lib/i18n/languages";

const PriceSchema = z.object({
  min: z.number(),
  max: z.number(),
  currency: z.string().describe("ISO 4217 code, e.g. USD"),
  unit: z.string().nullable().describe('e.g. "per person", or null'),
});

const EventsSchema = z.object({
  summary: z.string().describe("1-2 sentences: what is on during these dates."),
  events: z.array(
    z.object({
      name: z.string(),
      category: z.string().describe("Short type: festival, concert, sale, market, sports, exhibition, ..."),
      where: z.string().describe("Venue or area in the destination."),
      when: z.string().describe("Date, or the usual period if unsure of the exact day."),
      description: z.string().describe("What it is and why a traveler might go (1-2 sentences)."),
      moreInfo: z.string().describe("Where the traveler can get more details: the organizer, official ticket seller, or the city/national tourism board. Name the source; only give a web address if you are sure of it."),
      price: PriceSchema.nullable(),
    }),
  ),
  caveat: z.string().describe("Dates and details change: tell them to check the official website or tickets page."),
});

const EVENTS_PROMPT = `${SHARED_RULES}

The traveler wants to know what is happening in one place during their dates: festivals, concerts, sports, exhibitions, markets, public holidays, and big store sales.
- events: 4-10 items, ordered by date (or by how well-known they are). Each has the name, a short category, where it takes place, when, a short description, moreInfo (the best place to read more or buy tickets: organizer, official ticket site, or the local tourism board; never invent a URL), and an estimated ticket or entry price (or null when free or unknown).
- If you know of nothing reliable for that place and time, return an empty list and say so in summary.
- caveat: one honest sentence that dates and details can change and must be checked on the official website.`;

function toPrice(p: z.infer<typeof PriceSchema> | null): PriceRange | undefined {
  if (!p) return undefined;
  const [min, max] = p.min <= p.max ? [p.min, p.max] : [p.max, p.min];
  return { min, max, currency: p.currency.toUpperCase(), unit: p.unit ?? undefined };
}

export async function askEvents(
  request: { destination: string; startDate: string; endDate: string },
  language: LanguageCode,
): Promise<EventsAnswer> {
  const raw = await callClaude(
    EventsSchema,
    EVENTS_PROMPT,
    `Destination: ${request.destination}\nDates: ${request.startDate} to ${request.endDate}\nWhat events, festivals and sales are on?`,
    language,
  );
  return {
    summary: raw.summary,
    events: raw.events.slice(0, 12).map((e) => ({
      name: e.name,
      category: e.category,
      where: e.where,
      when: e.when,
      description: e.description,
      moreInfo: e.moreInfo,
      price: toPrice(e.price),
    })),
    caveat: raw.caveat,
  };
}

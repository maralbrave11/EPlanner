// Server-only: asks Claude a travel question and returns an answer in one of the
// trip-assistant formats (docs/plan.md §5). Never import this from client code.
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type {
  AssistantAnswer,
  AssistantMode,
  AssistantOption,
  OptionsAnswer,
  PlaceDetailAnswer,
  PriceRange,
  RouteAnswer,
} from "@/features/trip-assistant/types";

const MODEL = "claude-sonnet-5-5";

// ---------------------------------------------------------------------------
// Structured output schemas. Optional fields are `nullable` here and converted
// to `undefined` below so the frontend types stay clean.
// ---------------------------------------------------------------------------

const PriceSchema = z.object({
  min: z.number(),
  max: z.number(),
  currency: z.string().describe("ISO 4217 code, e.g. USD"),
  unit: z.string().nullable().describe('e.g. "per night", "per person", or null'),
});

const OptionsSchema = z.object({
  summary: z.string().describe("Short plain-language answer, 1-2 sentences."),
  recommendation: z.object({
    title: z.string(),
    reason: z.string(),
    price: PriceSchema.nullable(),
  }),
  options: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        price: PriceSchema.nullable(),
        pros: z.array(z.string()),
        cons: z.array(z.string()),
      }),
    )
    .describe("5 to 8 alternatives to the recommendation (up to 10 when listing things to see or do)."),
  followUpQuestion: z
    .string()
    .nullable()
    .describe("One question that would most improve the next answer, or null."),
});

const DetailSchema = z.object({
  title: z.string().describe("The place's name."),
  summary: z.string().describe("What it is and who it suits, 2-3 sentences."),
  sections: z.array(
    z.object({
      heading: z.string(),
      items: z.array(z.object({ name: z.string(), note: z.string().nullable() })),
    }),
  ),
  facts: z.array(z.object({ label: z.string(), value: z.string() })),
  price: PriceSchema.nullable(),
  caveat: z.string().nullable(),
  routeQuestion: z.string(),
});

const RouteSchema = z.object({
  title: z.string(),
  summary: z.string(),
  steps: z.array(
    z.object({
      name: z.string(),
      why: z.string(),
      minutes: z.number().nullable(),
      tip: z.string().nullable(),
    }),
  ),
  totalMinutes: z.number().nullable(),
  tips: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const BASE_PROMPT = `You are SmartTrip, a travel assistant that helps people save money and time.

Prices:
- Give prices only as estimated ranges (min and max), never a single exact number. Use typical market prices you are reasonably confident about.
- Use USD unless the traveler asks for another currency or clearly uses one.
- If something has nothing to do with money (for example, a visa rule or a cultural tip), set price to null.
- If you are unsure, widen the range and say so. Never invent specific deals, discounts, events, shops, or brands you cannot stand behind.

Style: plain, friendly English. Be specific (real neighborhoods, lines, places).`;

const ASK_PROMPT = `${BASE_PROMPT}

For every question, reply with:
- summary: a short, direct answer (1-2 sentences).
- recommendation: the single best choice for this traveler, with a concrete reason.
- options: 5-8 real, different alternatives (up to 10 when the question is about things to see or do), ordered from most to least relevant. Each has a short description, pros and cons. Never pad the list with near-duplicates; if fewer than 5 truly good options exist, give fewer.
- followUpQuestion: one question that would most improve your next answer (for example, missing dates, budget, number of travelers, or a preference), or null if nothing important is missing.

If the question is not about travel, briefly say you can only help with travel and set options to an empty array.`;

const DETAIL_PROMPT = `${BASE_PROMPT}

The traveler tapped "Tell me more" about ONE place from your earlier answer. Write only about that place, not the other options.
- title: the place's name.
- summary: what it is and who it suits (2-3 sentences).
- sections: what is inside or worth knowing, with headings that fit the kind of place. For an outlet or shopping mall use "Stores and brands" (split into categories such as "Sportswear" or "Fashion" when there are many). For a museum use "Main exhibits". For a neighborhood use "Places worth a stop". For a hotel use "Rooms and facilities". For a park or nature site use "Things to see and do". Aim for 6-15 items in total, each with a short note (or null).
- facts: 3-6 practical facts, for example best time to go, how long to plan, how to get there, how crowded it gets.
- price: a typical spend or entry price as an estimated range, or null.
- caveat: store lineups, opening hours and prices change, so tell them to check the official website before going. List only names you are confident really exist there; if you do not know what is inside, say so here and list only what you are sure about. Never invent shop or brand names.
- routeQuestion: one friendly sentence offering a suggested visiting order for this place (for example, to save walking and time).`;

const ROUTE_PROMPT = `${BASE_PROMPT}

The traveler said yes to a suggested visiting order for the place you just described. Use the same stores, sights, or items you listed in your previous detail answer (same names); do not add new ones you are unsure about.
- title: for example "Best order for <place>".
- summary: the idea behind the order in 1-2 sentences (for example, start at the far end, do the busiest stops early).
- steps: 4-10 stops in the order to visit. Each has the name, why it goes at this point, rough minutes (or null), and an optional short tip (or null).
- totalMinutes: the rough total, or null.
- tips: 2-4 practical tips (best time to arrive, what to bring, how to save money).`;

let client: Anthropic | null = null;
function getClient() {
  // Reads ANTHROPIC_API_KEY from the environment (.env.local / Vercel env vars).
  client ??= new Anthropic();
  return client;
}

/** One previous turn of the conversation, oldest first. */
export type HistoryTurn =
  | { role: "user"; content: string }
  | { role: "assistant"; answer: AssistantAnswer };

/** What the traveler asked for. `topic` is the place name for "detail" and "route". */
export type TripAssistantRequest =
  | { mode: "ask"; question: string }
  | { mode: Exclude<AssistantMode, "ask">; topic: string };

export class TripAssistantRefusal extends Error {}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

function toPrice(p: z.infer<typeof PriceSchema> | null): PriceRange | undefined {
  if (!p) return undefined;
  const [min, max] = p.min <= p.max ? [p.min, p.max] : [p.max, p.min];
  return { min, max, currency: p.currency.toUpperCase(), unit: p.unit ?? undefined };
}

function toOptionsAnswer(raw: z.infer<typeof OptionsSchema>): OptionsAnswer {
  return {
    kind: "options",
    summary: raw.summary,
    recommendation: {
      title: raw.recommendation.title,
      reason: raw.recommendation.reason,
      price: toPrice(raw.recommendation.price),
    },
    options: raw.options.slice(0, 10).map(
      (o): AssistantOption => ({
        title: o.title,
        description: o.description,
        price: toPrice(o.price),
        pros: o.pros,
        cons: o.cons,
      }),
    ),
    followUpQuestion: raw.followUpQuestion ?? undefined,
  };
}

function toDetailAnswer(raw: z.infer<typeof DetailSchema>): PlaceDetailAnswer {
  return {
    kind: "detail",
    title: raw.title,
    summary: raw.summary,
    sections: raw.sections
      .filter((s) => s.items.length > 0)
      .map((s) => ({
        heading: s.heading,
        items: s.items.map((i) => ({ name: i.name, note: i.note ?? undefined })),
      })),
    facts: raw.facts,
    price: toPrice(raw.price),
    caveat: raw.caveat ?? undefined,
    routeQuestion: raw.routeQuestion,
  };
}

function toRouteAnswer(raw: z.infer<typeof RouteSchema>): RouteAnswer {
  return {
    kind: "route",
    title: raw.title,
    summary: raw.summary,
    steps: raw.steps.map((s) => ({
      name: s.name,
      why: s.why,
      minutes: s.minutes ?? undefined,
      tip: s.tip ?? undefined,
    })),
    totalMinutes: raw.totalMinutes ?? undefined,
    tips: raw.tips,
  };
}

// ---------------------------------------------------------------------------
// Claude call
// ---------------------------------------------------------------------------

async function callClaude<T extends z.ZodType>(
  schema: T,
  systemPrompt: string,
  history: HistoryTurn[],
  userMessage: string,
): Promise<z.infer<T>> {
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((turn) =>
    turn.role === "user"
      ? { role: "user", content: turn.content }
      : { role: "assistant", content: JSON.stringify(turn.answer) },
  );
  messages.push({ role: "user", content: userMessage });

  const today = new Date().toISOString().slice(0, 10);

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // Chat-style Q&A: medium effort keeps answers thoughtful but fast.
    output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
    // If a safety classifier declines, retry on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `${systemPrompt}\n\nToday's date is ${today}.`,
    messages,
  });

  if (response.stop_reason === "refusal") {
    throw new TripAssistantRefusal("The assistant can't help with that question.");
  }
  if (!response.parsed_output) {
    throw new Error(`Claude returned no parsable answer (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output as z.infer<T>;
}

export async function askTripAssistant(
  history: HistoryTurn[],
  request: TripAssistantRequest,
): Promise<AssistantAnswer> {
  switch (request.mode) {
    case "ask":
      return toOptionsAnswer(await callClaude(OptionsSchema, ASK_PROMPT, history, request.question));
    case "detail":
      return toDetailAnswer(
        await callClaude(
          DetailSchema,
          DETAIL_PROMPT,
          history,
          `Tell me more about "${request.topic}". Only about this place.`,
        ),
      );
    case "route":
      return toRouteAnswer(
        await callClaude(
          RouteSchema,
          ROUTE_PROMPT,
          history,
          `Yes, please plan the best order to visit "${request.topic}".`,
        ),
      );
  }
}

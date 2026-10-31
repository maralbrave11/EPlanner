// Server-only: asks Claude a travel question and returns an answer in the
// trip-assistant format (docs/plan.md §5). Never import this from client code.
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { AssistantAnswer, AssistantOption, PriceRange } from "@/features/trip-assistant/types";

const MODEL = "claude-opus-5-5";

// Structured output schema. Optional fields are `nullable` here and converted
// to `undefined` below so the frontend types stay unchanged.
const PriceSchema = z.object({
  min: z.number(),
  max: z.number(),
  currency: z.string().describe("ISO 4217 code, e.g. USD"),
  unit: z.string().nullable().describe('e.g. "per night", "per person", or null'),
});

const AnswerSchema = z.object({
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
    .describe("2 to 4 alternatives to the recommendation."),
  followUpQuestion: z
    .string()
    .nullable()
    .describe("One question that would most improve the next answer, or null."),
});

type RawAnswer = z.infer<typeof AnswerSchema>;
type RawPrice = z.infer<typeof PriceSchema>;

const SYSTEM_PROMPT = `You are SmartTrip, a travel assistant that helps people save money and time.

For every question, reply with:
- summary: a short, direct answer (1-2 sentences).
- recommendation: the single best choice for this traveler, with a concrete reason.
- options: 2-4 real alternatives, each with a short description, pros and cons.
- followUpQuestion: one question that would most improve your next answer (for example, missing dates, budget, number of travelers, or a preference), or null if nothing important is missing.

Prices:
- Give prices only as estimated ranges (min and max), never a single exact number. Use typical market prices you are reasonably confident about.
- Use USD unless the traveler asks for another currency or clearly uses one.
- If a question has nothing to do with money (for example, a visa rule or a cultural tip), set price to null.
- If you are unsure, widen the range and say so in the reason or description. Never invent specific deals, discounts, or events you cannot stand behind.

Style: plain, friendly English. Be specific (real neighborhoods, lines, places). If the question is not about travel, briefly say you can only help with travel and set options to an empty array.`;

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

export class TripAssistantRefusal extends Error {}

function toPrice(p: RawPrice | null): PriceRange | undefined {
  if (!p) return undefined;
  const [min, max] = p.min <= p.max ? [p.min, p.max] : [p.max, p.min];
  return { min, max, currency: p.currency.toUpperCase(), unit: p.unit ?? undefined };
}

function toAnswer(raw: RawAnswer): AssistantAnswer {
  return {
    summary: raw.summary,
    recommendation: {
      title: raw.recommendation.title,
      reason: raw.recommendation.reason,
      price: toPrice(raw.recommendation.price),
    },
    options: raw.options.slice(0, 4).map(
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

export async function askTripAssistant(
  history: HistoryTurn[],
  question: string,
): Promise<AssistantAnswer> {
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((turn) =>
    turn.role === "user"
      ? { role: "user", content: turn.content }
      : { role: "assistant", content: JSON.stringify(turn.answer) },
  );
  messages.push({ role: "user", content: question });

  const today = new Date().toISOString().slice(0, 10);

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // Chat-style Q&A: medium effort keeps answers thoughtful but fast.
    output_config: { effort: "medium", format: betaZodOutputFormat(AnswerSchema) },
    // If a safety classifier declines, retry on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `${SYSTEM_PROMPT}\n\nToday's date is ${today}.`,
    messages,
  });

  if (response.stop_reason === "refusal") {
    throw new TripAssistantRefusal("The assistant can't help with that question.");
  }
  if (!response.parsed_output) {
    throw new Error(`Claude returned no parsable answer (stop_reason: ${response.stop_reason})`);
  }
  return toAnswer(response.parsed_output);
}

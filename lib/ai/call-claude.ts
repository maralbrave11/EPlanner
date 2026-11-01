// Server-only: small shared helper for the trip-planner and events features.
// Sends one message to Claude and returns structured (zod-validated) output.
// (The trip-assistant feature has its own copy in lib/trip-assistant/claude.ts.)
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getLanguage, type LanguageCode } from "@/lib/i18n/languages";

const MODEL = "claude-sonnet-5-5";

export class AiRefusal extends Error {}

let client: Anthropic | null = null;
function getClient() {
  // Reads ANTHROPIC_API_KEY from the environment (.env.local / Vercel env vars).
  client ??= new Anthropic();
  return client;
}

/** Prices, honesty, and language rules that every prompt shares. */
export const SHARED_RULES = `You are SmartTrip, a travel assistant that helps people save money and time.

You cannot browse the internet. You only know what you learned in training, so:
- Only name events, festivals and sales you are reasonably sure happen in that place around that time of year (annual festivals, public holidays, seasonal shopping sales). Never invent a specific event, store or discount.
- When you are not sure of an exact date, give the usual period (for example "usually mid-July") instead of an exact day, and say so.
- If you do not know of anything for that time and place, say so honestly and return fewer items (or none).
- Always remind the traveler to check the official website or ticket page.

Prices: only as estimated ranges (min and max), never one exact number. Use USD unless the traveler asks otherwise. If something has no price (a free festival, a free sight), set price to null.

Style: plain and friendly. Be specific (real neighborhoods, venues, places).`;

function languageInstruction(language: LanguageCode) {
  const { ai } = getLanguage(language);
  return `Language: write every text field of your answer in ${ai}. Keep the structure and field names exactly as required. Write names of places, stores and brands the way people in that language normally write them (use the original Latin spelling for brands). Dates in text fields should be easy to read in that language.`;
}

export async function callClaude<T extends z.ZodType>(
  schema: T,
  systemPrompt: string,
  userMessage: string,
  language: LanguageCode,
): Promise<z.infer<T>> {
  const today = new Date().toISOString().slice(0, 10);

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
    // If a safety classifier declines, retry on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `${systemPrompt}\n\n${languageInstruction(language)}\n\nToday's date is ${today}.`,
    messages: [{ role: "user", content: userMessage }],
  });

  if (response.stop_reason === "refusal") throw new AiRefusal("The assistant can't help with that.");
  if (!response.parsed_output) {
    throw new Error(`Claude returned no parsable answer (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output as z.infer<T>;
}

/** `code` lets the browser show the message in the user's language (err.* keys). */
export function errorResponse(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

/** Turns a Claude/Anthropic failure into a JSON error response. */
export function claudeErrorResponse(err: unknown, label: string) {
  if (err instanceof AiRefusal) {
    return errorResponse(422, "refused", "Sorry, I can't help with that request. Try changing it.");
  }
  if (err instanceof Anthropic.RateLimitError) {
    return errorResponse(429, "busy", "The assistant is busy right now. Please try again in a moment.");
  }
  if (err instanceof Anthropic.AuthenticationError) {
    console.error(`${label}: invalid ANTHROPIC_API_KEY`);
    return errorResponse(500, "config", "The assistant is not configured correctly.");
  }
  console.error(`${label}: Claude error`, err);
  return errorResponse(502, "claude", "The assistant could not answer right now. Please try again.");
}

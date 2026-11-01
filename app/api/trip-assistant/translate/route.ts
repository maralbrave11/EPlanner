// POST /api/trip-assistant/translate
// Body: { answer: PlaceDetailAnswer | RouteAnswer, language: LanguageCode }
// Translates a "Tell me more" / route answer into the language the user switched to.
// Nothing is saved. Runs as a Vercel serverless function.
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { LANGUAGE_CODES } from "@/lib/i18n/languages";
import { createClient } from "@/lib/supabase/server";
import {
  TripAssistantRefusal,
  TranslatableAnswerSchema,
  translateAnswer,
} from "@/lib/trip-assistant/claude";

export const maxDuration = 60;

const BodySchema = z.object({
  answer: TranslatableAnswerSchema,
  language: z.enum(LANGUAGE_CODES),
});

function errorResponse(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(400, "badInput", "Invalid request.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse(401, "login", "Please log in to ask questions.");

  try {
    const answer = await translateAnswer(parsed.data.answer, parsed.data.language);
    return NextResponse.json({ answer: { ...answer, lang: parsed.data.language } });
  } catch (err) {
    if (err instanceof TripAssistantRefusal) {
      return errorResponse(422, "refused", "Sorry, I can't translate that.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      return errorResponse(429, "busy", "The assistant is busy right now. Please try again in a moment.");
    }
    console.error("trip-assistant: translate failed", err);
    return errorResponse(502, "claude", "The assistant could not answer right now. Please try again.");
  }
}

// POST /api/translate
// Body: { strings: string[], language: LanguageCode }
// Translates the visible texts of an events / trip-planner answer into the language the user
// switched to. Returns { answer: { strings } } with the same number of strings, same order.
// Nothing is saved. Runs as a Vercel serverless function.
import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaude, claudeErrorResponse, errorResponse } from "@/lib/ai/call-claude";
import { LANGUAGE_CODES } from "@/lib/i18n/languages";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const BodySchema = z.object({
  strings: z.array(z.string().max(2000)).min(1).max(400),
  language: z.enum(LANGUAGE_CODES),
});

const OutputSchema = z.object({ strings: z.array(z.string()) });

const PROMPT = `You are SmartTrip's translator. The user message is a JSON object with a "strings" array of short texts from a travel answer. Translate every string into the target language and return an object with a "strings" array.
- Return exactly the same number of strings in exactly the same order: one translated string for each input string, nothing added, removed, merged or split.
- Keep numbers, prices, currency symbols and times as they are.
- Keep brand names in their original Latin spelling; translate everything else, including place and event names the way people in the target language normally write them.
- A string that is already in the target language stays as it is.`;

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(400, "badInput", "Invalid request.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse(401, "login", "Please log in to ask questions.");

  const { strings, language } = parsed.data;
  try {
    const out = await callClaude(OutputSchema, PROMPT, JSON.stringify({ strings }), language);
    if (out.strings.length !== strings.length) {
      console.error("translate: string count changed", strings.length, out.strings.length);
      return errorResponse(502, "claude", "The assistant could not answer right now. Please try again.");
    }
    return NextResponse.json({ answer: { strings: out.strings } });
  } catch (err) {
    return claudeErrorResponse(err, "translate");
  }
}

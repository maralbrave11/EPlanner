// POST /api/trip-assistant
// Body: { conversationId: uuid, question: string, mode?: "ask" | "detail" | "route", topic?: string, language?: LanguageCode }
//   ask    (default): normal question → recommendation + options
//   detail: "Tell me more" about `topic` → what is inside that place + route offer
//   route:  "Yes, plan my route" for `topic` → suggested visiting order
// Asks Claude, then saves the question + answer to Supabase (RLS: own rows only).
// Runs as a Vercel serverless function.
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { AssistantAnswer } from "@/features/trip-assistant/types";
import { checkAccess, logActivity } from "@/lib/admin/guard";
import { LANGUAGE_CODES } from "@/lib/i18n/languages";
import { createClient } from "@/lib/supabase/server";
import {
  askTripAssistant,
  TripAssistantRefusal,
  type HistoryTurn,
} from "@/lib/trip-assistant/claude";

// Claude can take a while on detailed questions.
export const maxDuration = 60;

const MAX_HISTORY_MESSAGES = 20;

const BodySchema = z
  .object({
    conversationId: z.uuid(),
    question: z.string().trim().min(1).max(2000),
    mode: z.enum(["ask", "detail", "route"]).default("ask"),
    topic: z.string().trim().min(1).max(200).optional(),
    // Language the AI answers in (the language picked in the app).
    language: z.enum(LANGUAGE_CODES).default("en"),
  })
  .refine((b) => b.mode === "ask" || b.topic, { message: "topic is required" });

/** `code` lets the browser show the message in the user's language (see err.* in lib/i18n/messages). */
function errorResponse(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

function titleFrom(question: string) {
  return question.length > 60 ? `${question.slice(0, 57)}…` : question;
}

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(400, "badInput", "Please enter a question (up to 2000 characters).");
  const { conversationId, question, mode, topic, language } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse(401, "login", "Please log in to ask questions.");

  const denied = await checkAccess(supabase, user.id, "trip-assistant");
  if (denied) return denied;

  // Existing conversation? RLS returns nothing if it belongs to someone else.
  const { data: existing, error: lookupError } = await supabase
    .from("assistant_conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();
  if (lookupError) {
    console.error("trip-assistant: conversation lookup failed", lookupError);
    return errorResponse(500, "load", "Could not load your conversation. Please try again.");
  }

  // "Tell me more" and "plan my route" only make sense inside an existing conversation.
  if (mode !== "ask" && !existing) return errorResponse(404, "notFound", "Conversation not found.");

  let history: HistoryTurn[] = [];
  if (existing) {
    const { data: rows, error } = await supabase
      .from("assistant_messages")
      .select("role, content, answer")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY_MESSAGES);
    if (error) {
      console.error("trip-assistant: history load failed", error);
      return errorResponse(500, "load", "Could not load your conversation. Please try again.");
    }
    history = rows.reverse().map((r) =>
      r.role === "user"
        ? { role: "user", content: r.content as string }
        : { role: "assistant", answer: r.answer as AssistantAnswer },
    );
    // Claude expects the history to start with a user turn.
    while (history.length && history[0].role !== "user") history.shift();
  }

  // Ask Claude first; only save once there is an answer, so "Try again" never duplicates.
  let answer: AssistantAnswer;
  try {
    answer = await askTripAssistant(
      history,
      mode === "ask" ? { mode, question, language } : { mode, topic: topic!, language },
    );
    // Remember the language so it can be translated when the user switches language.
    if (answer.kind === "detail" || answer.kind === "route") answer = { ...answer, lang: language };
  } catch (err) {
    if (err instanceof TripAssistantRefusal) {
      return errorResponse(422, "refused", "Sorry, I can't help with that question. Try asking it differently.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      return errorResponse(429, "busy", "The assistant is busy right now. Please try again in a moment.");
    }
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("trip-assistant: invalid ANTHROPIC_API_KEY");
      return errorResponse(500, "config", "The assistant is not configured correctly.");
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`trip-assistant: Claude API error ${err.status}`, err.message);
      return errorResponse(502, "claude", "The assistant could not answer right now. Please try again.");
    }
    console.error("trip-assistant: unexpected error", err);
    return errorResponse(502, "claude", "The assistant could not answer right now. Please try again.");
  }

  await logActivity(supabase, user.id, "assistant", mode === "ask" ? question : `${mode}: ${topic}`, {
    conversationId,
    mode,
  });

  if (!existing) {
    const { error } = await supabase
      .from("assistant_conversations")
      .insert({ id: conversationId, user_id: user.id, title: titleFrom(question) });
    if (error) {
      console.error("trip-assistant: conversation insert failed", error);
      return errorResponse(500, "save", "Could not save your conversation. Please try again.");
    }
  }

  // Two inserts (not one batch) so created_at keeps question-before-answer order.
  const { error: userMsgError } = await supabase
    .from("assistant_messages")
    .insert({ conversation_id: conversationId, role: "user", content: question });
  const { error: answerMsgError } = userMsgError
    ? { error: userMsgError }
    : await supabase
        .from("assistant_messages")
        .insert({ conversation_id: conversationId, role: "assistant", answer });
  if (userMsgError || answerMsgError) {
    // The answer is still useful to show even if saving failed.
    console.error("trip-assistant: message insert failed", userMsgError ?? answerMsgError);
  }

  return NextResponse.json({ answer, saved: !(userMsgError || answerMsgError) });
}

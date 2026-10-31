// POST /api/trip-assistant
// Body: { conversationId: uuid, question: string, mode?: "ask" | "detail" | "route", topic?: string }
//   ask    (default): normal question → recommendation + options
//   detail: "Tell me more" about `topic` → what is inside that place + route offer
//   route:  "Yes, plan my route" for `topic` → suggested visiting order
// Asks Claude, then saves the question + answer to Supabase (RLS: own rows only).
// Runs as a Vercel serverless function.
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { AssistantAnswer } from "@/features/trip-assistant/types";
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
  })
  .refine((b) => b.mode === "ask" || b.topic, { message: "topic is required" });

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function titleFrom(question: string) {
  return question.length > 60 ? `${question.slice(0, 57)}…` : question;
}

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(400, "Please enter a question (up to 2000 characters).");
  const { conversationId, question, mode, topic } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse(401, "Please log in to ask questions.");

  // Existing conversation? RLS returns nothing if it belongs to someone else.
  const { data: existing, error: lookupError } = await supabase
    .from("assistant_conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();
  if (lookupError) {
    console.error("trip-assistant: conversation lookup failed", lookupError);
    return errorResponse(500, "Could not load your conversation. Please try again.");
  }

  // "Tell me more" and "plan my route" only make sense inside an existing conversation.
  if (mode !== "ask" && !existing) return errorResponse(404, "Conversation not found.");

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
      return errorResponse(500, "Could not load your conversation. Please try again.");
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
      mode === "ask" ? { mode, question } : { mode, topic: topic! },
    );
  } catch (err) {
    if (err instanceof TripAssistantRefusal) {
      return errorResponse(422, "Sorry, I can't help with that question. Try asking it differently.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      return errorResponse(429, "The assistant is busy right now. Please try again in a moment.");
    }
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("trip-assistant: invalid ANTHROPIC_API_KEY");
      return errorResponse(500, "The assistant is not configured correctly.");
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`trip-assistant: Claude API error ${err.status}`, err.message);
      return errorResponse(502, "The assistant could not answer right now. Please try again.");
    }
    console.error("trip-assistant: unexpected error", err);
    return errorResponse(502, "The assistant could not answer right now. Please try again.");
  }

  if (!existing) {
    const { error } = await supabase
      .from("assistant_conversations")
      .insert({ id: conversationId, user_id: user.id, title: titleFrom(question) });
    if (error) {
      console.error("trip-assistant: conversation insert failed", error);
      return errorResponse(500, "Could not save your conversation. Please try again.");
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

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTripAssistant } from "../trip-assistant-provider";
import { AnswerCard } from "./answer-card";
import { QuestionInput } from "./question-input";
import { TripAssistantShell } from "./trip-assistant-shell";

/** /trip-assistant/[conversationId] — messages, loading, error, and follow-ups. */
export function ConversationView({ conversationId }: { conversationId: string }) {
  const { conversations, isPending, getError, sendMessage, retry } = useTripAssistant();
  const conversation = conversations.find((c) => c.id === conversationId);
  const pending = isPending(conversationId);
  const error = getError(conversationId);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null);

  const messageCount = conversation?.messages.length ?? 0;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageCount, pending, error]);

  if (!conversation) {
    return (
      <TripAssistantShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <h1 className="text-xl font-semibold">Conversation not found</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            It may have been deleted, or the link is wrong.
          </p>
          <Link href="/trip-assistant" className="font-medium text-emerald-700 underline">
            Ask a new question
          </Link>
        </div>
      </TripAssistantShell>
    );
  }

  function ask(question: string) {
    setFollowUpPrompt(null);
    sendMessage(conversationId, question);
  }

  const lastAssistantIndex = conversation.messages.findLastIndex((m) => m.role === "assistant");

  return (
    <TripAssistantShell activeId={conversationId}>
      <div className="flex flex-1 flex-col gap-6 pb-4">
        {conversation.messages.map((message, index) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-emerald-600 px-4 py-2 text-white">
                {message.content}
              </p>
            </div>
          ) : (
            <AnswerCard
              key={message.id}
              answer={message.answer}
              disabled={pending}
              // Only the latest answer is interactive.
              onPickOption={
                index === lastAssistantIndex
                  ? (title) => ask(`Tell me more about "${title}".`)
                  : undefined
              }
              onAnswerFollowUp={
                index === lastAssistantIndex
                  ? (q) => {
                      setFollowUpPrompt(q);
                      inputRef.current?.focus();
                    }
                  : undefined
              }
            />
          ),
        )}

        {pending && (
          <div role="status" className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Finding the best options for you…
          </div>
        )}

        {error && !pending && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
          >
            <span className="flex-1">{error.message}</span>
            <button
              type="button"
              onClick={() => retry(conversationId)}
              className="rounded-md bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700"
            >
              Try again
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-background pt-2 pb-4">
        {followUpPrompt && (
          <p className="mb-2 text-sm text-sky-700 dark:text-sky-300">Answering: {followUpPrompt}</p>
        )}
        <QuestionInput
          ref={inputRef}
          onSubmit={ask}
          disabled={pending}
          placeholder={followUpPrompt ? "Type your answer…" : "Ask a follow-up question…"}
        />
      </div>
    </TripAssistantShell>
  );
}

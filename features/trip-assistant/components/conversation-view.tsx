"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTripAssistant } from "../trip-assistant-provider";
import { AnswerCard } from "./answer-card";
import { QuestionInput } from "./question-input";
import { TripAssistantShell } from "./trip-assistant-shell";

/** /trip-assistant/[conversationId] — messages, loading, error, and follow-ups. */
export function ConversationView({ conversationId }: { conversationId: string }) {
  const { conversations, listStatus, isPending, getError, loadMessages, sendMessage, retry } =
    useTripAssistant();
  const conversation = conversations.find((c) => c.id === conversationId);
  const pending = isPending(conversationId);
  const error = getError(conversationId);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null);

  useEffect(() => {
    loadMessages(conversationId);
  }, [conversationId, loadMessages]);

  const messageCount = conversation?.messages?.length ?? 0;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageCount, pending, error]);

  if (listStatus === "error" && !conversation) {
    return (
      <TripAssistantShell activeId={conversationId}>
        <p role="alert" className="py-12 text-center text-rose-700 dark:text-rose-300">
          Could not load your conversations. Please refresh the page.
        </p>
      </TripAssistantShell>
    );
  }

  if ((listStatus === "loading" && !conversation) || (conversation && !conversation.messages)) {
    return (
      <TripAssistantShell activeId={conversationId}>
        <p role="status" className="py-12 text-center text-sm text-muted">
          Loading conversation…
        </p>
      </TripAssistantShell>
    );
  }

  if (!conversation?.messages) {
    return (
      <TripAssistantShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <h1 className="text-xl font-semibold">Conversation not found</h1>
          <p className="text-muted">
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

  const messages = conversation.messages;
  const lastAssistantIndex = messages.findLastIndex((m) => m.role === "assistant");

  return (
    <TripAssistantShell activeId={conversationId}>
      <div className="flex flex-1 flex-col gap-6 pb-4">
        {messages.map((message, index) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="rise-in max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-emerald-600 to-teal-600 px-4 py-2.5 text-white shadow-sm">
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
          <div role="status" className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Finding the best options for you…
            </p>
            <div className="skeleton h-24 rounded-2xl" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="skeleton h-28 rounded-2xl" />
              <div className="skeleton h-28 rounded-2xl" />
            </div>
          </div>
        )}

        {error && !pending && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
          >
            <span className="flex-1">{error.message}</span>
            {error.question && (
              <button
                type="button"
                onClick={() => retry(conversationId)}
                className="rounded-md bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700"
              >
                Try again
              </button>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-background from-70% to-transparent pt-6 pb-4">
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

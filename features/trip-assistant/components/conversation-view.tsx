"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { useTripAssistant } from "../trip-assistant-provider";
import { AnswerCard } from "./answer-card";
import { PlaceDetailCard } from "./place-detail-card";
import { QuestionInput } from "./question-input";
import { RouteCard } from "./route-card";
import { TripAssistantShell } from "./trip-assistant-shell";

/** /trip-assistant/[conversationId] — messages, loading, error, and follow-ups. */
export function ConversationView({ conversationId }: { conversationId: string }) {
  const {
    conversations,
    listStatus,
    isPending,
    getError,
    displayAnswer,
    isTranslating,
    loadMessages,
    sendMessage,
    retry,
  } = useTripAssistant();
  const { t, tError } = useI18n();
  const conversation = conversations.find((c) => c.id === conversationId);
  const pending = isPending(conversationId);
  const error = getError(conversationId);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null);
  // Detail answers whose route offer the user turned down (hides the offer).
  const [declinedRoutes, setDeclinedRoutes] = useState<ReadonlySet<string>>(new Set());

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
          {t("view.listError")}
        </p>
      </TripAssistantShell>
    );
  }

  if ((listStatus === "loading" && !conversation) || (conversation && !conversation.messages)) {
    return (
      <TripAssistantShell activeId={conversationId}>
        <p role="status" className="py-12 text-center text-sm text-muted">
          {t("view.loading")}
        </p>
      </TripAssistantShell>
    );
  }

  if (!conversation?.messages) {
    return (
      <TripAssistantShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <h1 className="text-xl font-semibold">{t("view.notFoundTitle")}</h1>
          <p className="text-muted">
            {t("view.notFoundText")}
          </p>
          <Link href="/trip-assistant" className="font-medium text-emerald-700 underline">
            {t("view.askNew")}
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
  // Option cards stay clickable after "Tell me more", so the user can explore other places.
  const lastOptionsIndex = messages.findLastIndex(
    (m) => m.role === "assistant" && (m.answer.kind === undefined || m.answer.kind === "options"),
  );

  return (
    <TripAssistantShell activeId={conversationId}>
      <div className="flex flex-1 flex-col gap-6 pb-4">
        {messages.map((original, index) => {
          const message =
            original.role === "assistant"
              ? { ...original, answer: displayAnswer(original.id, original.answer) }
              : original;
          return message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="rise-in max-w-[80%] rounded-2xl rounded-be-md bg-gradient-to-br from-emerald-600 to-teal-600 px-4 py-2.5 text-white shadow-sm">
                {message.content}
              </p>
            </div>
          ) : message.answer.kind === "detail" ? (
            <div key={message.id} className="flex flex-col gap-2">
            {isTranslating(message.id) && (
              <p role="status" className="text-xs text-muted">{t("view.translating")}</p>
            )}
            <PlaceDetailCard
              answer={message.answer}
              disabled={pending}
              // The route offer is only for the latest answer, until declined.
              onWantRoute={
                index === lastAssistantIndex && !declinedRoutes.has(message.id)
                  ? () => {
                      const place = message.answer.kind === "detail" ? message.answer.title : "";
                      sendMessage(conversationId, t("view.routeMsg", { place }), "route", place);
                    }
                  : undefined
              }
              onDeclineRoute={
                index === lastAssistantIndex && !declinedRoutes.has(message.id)
                  ? () => setDeclinedRoutes((prev) => new Set(prev).add(message.id))
                  : undefined
              }
            />
            </div>
          ) : message.answer.kind === "route" ? (
            <div key={message.id} className="flex flex-col gap-2">
              {isTranslating(message.id) && (
                <p role="status" className="text-xs text-muted">{t("view.translating")}</p>
              )}
              <RouteCard answer={message.answer} />
            </div>
          ) : (
            <AnswerCard
              key={message.id}
              answer={message.answer}
              disabled={pending}
              // Only the latest options answer is interactive.
              onPickOption={
                index === lastOptionsIndex
                  ? (title) => {
                      setFollowUpPrompt(null);
                      sendMessage(conversationId, t("view.tellMeMsg", { title }), "detail", title);
                    }
                  : undefined
              }
              onAnswerFollowUp={
                index === lastOptionsIndex
                  ? (q) => {
                      setFollowUpPrompt(q);
                      inputRef.current?.focus();
                    }
                  : undefined
              }
            />
          );
        })}

        {pending && (
          <div role="status" className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {t("view.finding")}
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
            <span className="flex-1">{tError(error.code) ?? error.message}</span>
            {error.question && (
              <button
                type="button"
                onClick={() => retry(conversationId)}
                className="rounded-md bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700"
              >
                {t("view.tryAgain")}
              </button>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="pt-2 pb-4">
        {followUpPrompt && (
          <p className="mb-2 text-sm text-sky-700 dark:text-sky-300">{t("view.answering", { question: followUpPrompt })}</p>
        )}
        <QuestionInput
          ref={inputRef}
          onSubmit={ask}
          disabled={pending}
          placeholder={followUpPrompt ? t("input.answerPlaceholder") : t("input.followUp")}
        />
      </div>
    </TripAssistantShell>
  );
}

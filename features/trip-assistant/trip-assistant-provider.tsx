"use client";

// Holds trip-assistant conversations in memory (Stage 1, mock only).
// Mounted in app/trip-assistant/layout.tsx so state survives navigation
// between /trip-assistant and /trip-assistant/[conversationId].

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { askMockAssistant } from "./mock-assistant";
import { MOCK_CONVERSATIONS } from "./mock-data";
import type { AssistantConversation, AssistantMessage } from "./types";

type FailedRequest = { message: string; question: string };

type TripAssistantContextValue = {
  conversations: AssistantConversation[];
  isPending: (conversationId: string) => boolean;
  getError: (conversationId: string) => FailedRequest | undefined;
  /** Creates a conversation with the first question and returns its id. */
  startConversation: (question: string) => string;
  sendMessage: (conversationId: string, question: string) => void;
  retry: (conversationId: string) => void;
};

const TripAssistantContext = createContext<TripAssistantContextValue | null>(null);

function newId() {
  return crypto.randomUUID();
}

function titleFrom(question: string) {
  const trimmed = question.trim();
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed;
}

export function TripAssistantProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] =
    useState<AssistantConversation[]>(MOCK_CONVERSATIONS);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, FailedRequest | undefined>>({});

  const appendMessage = useCallback((conversationId: string, message: AssistantMessage) => {
    setConversations((prev) => {
      const target = prev.find((c) => c.id === conversationId);
      if (!target) return prev;
      const updated = { ...target, messages: [...target.messages, message] };
      // Most recently active conversation goes to the top of the list.
      return [updated, ...prev.filter((c) => c.id !== conversationId)];
    });
  }, []);

  const requestAnswer = useCallback(
    async (conversationId: string, question: string) => {
      setPending((p) => ({ ...p, [conversationId]: true }));
      setErrors((e) => ({ ...e, [conversationId]: undefined }));
      try {
        const answer = await askMockAssistant(question);
        appendMessage(conversationId, { id: newId(), role: "assistant", answer });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setErrors((e) => ({ ...e, [conversationId]: { message, question } }));
      } finally {
        setPending((p) => ({ ...p, [conversationId]: false }));
      }
    },
    [appendMessage],
  );

  const startConversation = useCallback(
    (question: string) => {
      const id = newId();
      const conversation: AssistantConversation = {
        id,
        title: titleFrom(question),
        messages: [{ id: newId(), role: "user", content: question }],
      };
      setConversations((prev) => [conversation, ...prev]);
      void requestAnswer(id, question);
      return id;
    },
    [requestAnswer],
  );

  const sendMessage = useCallback(
    (conversationId: string, question: string) => {
      appendMessage(conversationId, { id: newId(), role: "user", content: question });
      void requestAnswer(conversationId, question);
    },
    [appendMessage, requestAnswer],
  );

  const retry = useCallback(
    (conversationId: string) => {
      const failed = errors[conversationId];
      if (failed) void requestAnswer(conversationId, failed.question);
    },
    [errors, requestAnswer],
  );

  const value = useMemo<TripAssistantContextValue>(
    () => ({
      conversations,
      isPending: (id) => Boolean(pending[id]),
      getError: (id) => errors[id],
      startConversation,
      sendMessage,
      retry,
    }),
    [conversations, pending, errors, startConversation, sendMessage, retry],
  );

  return <TripAssistantContext value={value}>{children}</TripAssistantContext>;
}

export function useTripAssistant() {
  const ctx = useContext(TripAssistantContext);
  if (!ctx) throw new Error("useTripAssistant must be used inside TripAssistantProvider");
  return ctx;
}

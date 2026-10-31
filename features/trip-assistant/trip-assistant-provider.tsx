"use client";

// Holds trip-assistant conversations for the current user.
// - Conversation list and messages are read from Supabase (RLS: own rows only).
// - New questions go to POST /api/trip-assistant, which asks Claude and saves the result.
// Mounted in app/trip-assistant/layout.tsx so state survives navigation
// between /trip-assistant and /trip-assistant/[conversationId].

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AssistantAnswer, AssistantConversation, AssistantMessage } from "./types";

type FailedRequest = { message: string; question: string };
type ListStatus = "loading" | "ready" | "error";

type TripAssistantContextValue = {
  conversations: AssistantConversation[];
  listStatus: ListStatus;
  isPending: (conversationId: string) => boolean;
  getError: (conversationId: string) => FailedRequest | undefined;
  /** Loads messages for a conversation if they are not loaded yet. */
  loadMessages: (conversationId: string) => void;
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

async function askServer(conversationId: string, question: string): Promise<AssistantAnswer> {
  let res: Response;
  try {
    res = await fetch("/api/trip-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, question }),
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => null)) as
    | { answer?: AssistantAnswer; error?: string }
    | null;
  if (!res.ok || !data?.answer) {
    throw new Error(data?.error ?? "The assistant could not answer right now. Please try again.");
  }
  return data.answer;
}

export function TripAssistantProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [listStatus, setListStatus] = useState<ListStatus>("loading");
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, FailedRequest | undefined>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});

  // Load the conversation list once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await createClient()
          .from("assistant_conversations")
          .select("id, title")
          .order("updated_at", { ascending: false });
        if (error) throw error;
        if (cancelled) return;
        setConversations((prev) => {
          // Keep conversations started before the list arrived.
          const fetchedIds = new Set(data.map((c) => c.id));
          const local = prev.filter((c) => !fetchedIds.has(c.id));
          const fetched = data.map(
            (c): AssistantConversation => prev.find((p) => p.id === c.id) ?? c,
          );
          return [...local, ...fetched];
        });
        setListStatus("ready");
      } catch (err) {
        console.error("trip-assistant: could not load conversations", err);
        if (!cancelled) setListStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMessages = useCallback(
    (conversationId: string) => {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (!conversation || conversation.messages || loadingMessages[conversationId]) return;
      setLoadingMessages((l) => ({ ...l, [conversationId]: true }));
      (async () => {
        const { data, error } = await createClient()
          .from("assistant_messages")
          .select("id, role, content, answer")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        const messages: AssistantMessage[] = error
          ? []
          : data.map((m) =>
              m.role === "user"
                ? { id: m.id, role: "user", content: m.content as string }
                : { id: m.id, role: "assistant", answer: m.answer as AssistantAnswer },
            );
        if (error) {
          console.error("trip-assistant: could not load messages", error);
          setErrors((e) => ({
            ...e,
            [conversationId]: { message: "Could not load this conversation.", question: "" },
          }));
        }
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId && !c.messages ? { ...c, messages } : c)),
        );
        setLoadingMessages((l) => ({ ...l, [conversationId]: false }));
      })();
    },
    [conversations, loadingMessages],
  );

  const appendMessage = useCallback((conversationId: string, message: AssistantMessage) => {
    setConversations((prev) => {
      const target = prev.find((c) => c.id === conversationId);
      if (!target) return prev;
      const updated = { ...target, messages: [...(target.messages ?? []), message] };
      // Most recently active conversation goes to the top of the list.
      return [updated, ...prev.filter((c) => c.id !== conversationId)];
    });
  }, []);

  const requestAnswer = useCallback(
    async (conversationId: string, question: string) => {
      setPending((p) => ({ ...p, [conversationId]: true }));
      setErrors((e) => ({ ...e, [conversationId]: undefined }));
      try {
        const answer = await askServer(conversationId, question);
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
      if (failed?.question) void requestAnswer(conversationId, failed.question);
    },
    [errors, requestAnswer],
  );

  const value = useMemo<TripAssistantContextValue>(
    () => ({
      conversations,
      listStatus,
      isPending: (id) => Boolean(pending[id]),
      getError: (id) => errors[id],
      loadMessages,
      startConversation,
      sendMessage,
      retry,
    }),
    [conversations, listStatus, pending, errors, loadMessages, startConversation, sendMessage, retry],
  );

  return <TripAssistantContext value={value}>{children}</TripAssistantContext>;
}

export function useTripAssistant() {
  const ctx = useContext(TripAssistantContext);
  if (!ctx) throw new Error("useTripAssistant must be used inside TripAssistantProvider");
  return ctx;
}

"use client";

// Holds trip-assistant conversations for the current user.
// - Conversation list and messages are read from Supabase (RLS: own rows only).
// - New questions go to POST /api/trip-assistant, which asks Claude and saves the result.
// Mounted in app/trip-assistant/layout.tsx so state survives navigation
// between /trip-assistant and /trip-assistant/[conversationId].

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { LanguageCode } from "@/lib/i18n/languages";
import { createClient } from "@/lib/supabase/client";
import type {
  AssistantAnswer,
  AssistantConversation,
  AssistantMessage,
  AssistantMode,
} from "./types";

/** An error from the API route. `code` maps to a translated `err.<code>` message. */
class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

type FailedRequest = {
  message: string;
  question: string;
  /** Error code for a translated message (see err.* in lib/i18n/messages). */
  code?: string;
  mode?: AssistantMode;
  topic?: string;
};
type ListStatus = "loading" | "ready" | "error";

type TripAssistantContextValue = {
  conversations: AssistantConversation[];
  listStatus: ListStatus;
  isPending: (conversationId: string) => boolean;
  getError: (conversationId: string) => FailedRequest | undefined;
  /** The answer to show: its translation into the current language when one exists. */
  displayAnswer: (messageId: string, answer: AssistantAnswer) => AssistantAnswer;
  /** True while a message is being translated into the current language. */
  isTranslating: (messageId: string) => boolean;
  /** Loads messages for a conversation if they are not loaded yet. */
  loadMessages: (conversationId: string) => void;
  /** Creates a conversation with the first question and returns its id. */
  startConversation: (question: string) => string;
  /** `mode`/`topic`: "detail" or "route" about one place (see docs/plan.md §5). */
  sendMessage: (conversationId: string, question: string, mode?: AssistantMode, topic?: string) => void;
  retry: (conversationId: string) => void;
  /** Hides a conversation from the user (it is kept for the admin). Resolves to false if the database refused. */
  deleteConversation: (conversationId: string) => Promise<boolean>;
};

const TripAssistantContext = createContext<TripAssistantContextValue | null>(null);

function newId() {
  return crypto.randomUUID();
}

function titleFrom(question: string) {
  const trimmed = question.trim();
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed;
}

async function askServer(
  conversationId: string,
  question: string,
  mode: AssistantMode,
  topic: string | undefined,
  language: LanguageCode,
): Promise<AssistantAnswer> {
  let res: Response;
  try {
    res = await fetch("/api/trip-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, question, mode, topic, language }),
    });
  } catch {
    throw new ApiError("Network error. Check your connection and try again.", "network");
  }
  const data = (await res.json().catch(() => null)) as
    | { answer?: AssistantAnswer; error?: string; code?: string }
    | null;
  if (!res.ok || !data?.answer) {
    throw new ApiError(
      data?.error ?? "The assistant could not answer right now. Please try again.",
      data?.code ?? "claude",
    );
  }
  return data.answer;
}

export function TripAssistantProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n(); // the AI answers in this language
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
          .is("deleted_at", null) // "deleted" conversations are only hidden (the admin can still see them)
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
            [conversationId]: {
              message: "Could not load this conversation.",
              code: "loadMessages",
              question: "",
            },
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

  // "Tell me more" and route answers are translated when the user switches language.
  // Translations are kept in memory only (key = `${messageId}:${lang}`).
  const [translations, setTranslations] = useState<Record<string, AssistantAnswer>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const requestedTranslations = useRef(new Set<string>());

  useEffect(() => {
    for (const conversation of conversations) {
      for (const message of conversation.messages ?? []) {
        if (message.role !== "assistant") continue;
        const { answer } = message;
        if (answer.kind !== "detail" && answer.kind !== "route") continue;
        if ((answer.lang ?? "en") === lang) continue;
        const key = `${message.id}:${lang}`;
        if (requestedTranslations.current.has(key)) continue;
        requestedTranslations.current.add(key);
        setTranslating((s) => ({ ...s, [key]: true }));
        void (async () => {
          try {
            const res = await fetch("/api/trip-assistant/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answer, language: lang }),
            });
            const data = (await res.json().catch(() => null)) as { answer?: AssistantAnswer } | null;
            if (res.ok && data?.answer) setTranslations((s) => ({ ...s, [key]: data.answer! }));
            else requestedTranslations.current.delete(key); // allow a retry on the next change
          } catch {
            requestedTranslations.current.delete(key);
          } finally {
            setTranslating((s) => ({ ...s, [key]: false }));
          }
        })();
      }
    }
  }, [conversations, lang]);

  const requestAnswer = useCallback(
    async (
      conversationId: string,
      question: string,
      mode: AssistantMode = "ask",
      topic?: string,
    ) => {
      setPending((p) => ({ ...p, [conversationId]: true }));
      setErrors((e) => ({ ...e, [conversationId]: undefined }));
      try {
        const answer = await askServer(conversationId, question, mode, topic, lang);
        appendMessage(conversationId, { id: newId(), role: "assistant", answer });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        const code = err instanceof ApiError ? err.code : "generic";
        setErrors((e) => ({ ...e, [conversationId]: { message, code, question, mode, topic } }));
      } finally {
        setPending((p) => ({ ...p, [conversationId]: false }));
      }
    },
    [appendMessage, lang],
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
    (conversationId: string, question: string, mode: AssistantMode = "ask", topic?: string) => {
      appendMessage(conversationId, { id: newId(), role: "user", content: question });
      void requestAnswer(conversationId, question, mode, topic);
    },
    [appendMessage, requestAnswer],
  );

  const retry = useCallback(
    (conversationId: string) => {
      const failed = errors[conversationId];
      if (failed?.question) {
        void requestAnswer(conversationId, failed.question, failed.mode, failed.topic);
      }
    },
    [errors, requestAnswer],
  );

  const deleteConversation = useCallback(async (conversationId: string) => {
    // The conversation is hidden, not erased: it gets a deleted_at time (see sql/admin.sql)
    // and the admin can still read it. RLS only lets users change their own rows.
    // A conversation whose first answer failed was never saved, so 0 rows is fine too.
    const { error } = await createClient()
      .from("assistant_conversations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", conversationId);
    if (error) {
      console.error("trip-assistant: could not delete conversation", error);
      return false;
    }
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setErrors((e) => ({ ...e, [conversationId]: undefined }));
    return true;
  }, []);

  const value = useMemo<TripAssistantContextValue>(
    () => ({
      conversations,
      listStatus,
      isPending: (id) => Boolean(pending[id]),
      getError: (id) => errors[id],
      displayAnswer: (messageId, answer) => translations[`${messageId}:${lang}`] ?? answer,
      isTranslating: (messageId) => Boolean(translating[`${messageId}:${lang}`]),
      loadMessages,
      startConversation,
      sendMessage,
      retry,
      deleteConversation,
    }),
    [
      conversations,
      listStatus,
      pending,
      errors,
      translations,
      translating,
      lang,
      loadMessages,
      startConversation,
      sendMessage,
      retry,
      deleteConversation,
    ],
  );

  return <TripAssistantContext value={value}>{children}</TripAssistantContext>;
}

export function useTripAssistant() {
  const ctx = useContext(TripAssistantContext);
  if (!ctx) throw new Error("useTripAssistant must be used inside TripAssistantProvider");
  return ctx;
}

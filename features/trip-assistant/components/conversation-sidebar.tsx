"use client";

import Link from "next/link";
import { useTripAssistant } from "../trip-assistant-provider";

export function ConversationSidebar({ activeId }: { activeId?: string }) {
  const { conversations, listStatus } = useTripAssistant();

  return (
    <aside className="flex w-full flex-col gap-3 border-b border-line bg-surface/60 p-4 md:w-72 md:shrink-0 md:border-r md:border-b-0">
      <Link
        href="/trip-assistant"
        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2.5 text-center text-sm font-medium text-white shadow-sm transition hover:shadow-md"
      >
        + New question
      </Link>
      <p className="mt-1 text-xs font-semibold tracking-wide text-muted uppercase">
        Your conversations
      </p>
      {conversations.length === 0 && listStatus === "loading" ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading conversations">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-8 rounded-lg" />
          ))}
        </div>
      ) : conversations.length === 0 && listStatus === "error" ? (
        <p className="text-sm text-rose-700 dark:text-rose-300">Could not load conversations.</p>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-muted">No conversations yet. Ask your first question!</p>
      ) : (
        <nav className="flex max-h-48 flex-col gap-1 overflow-y-auto md:max-h-none">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/trip-assistant/${c.id}`}
              aria-current={c.id === activeId ? "page" : undefined}
              className={`truncate rounded-lg px-3 py-2 text-sm transition ${
                c.id === activeId
                  ? "bg-emerald-100 font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                  : "hover:bg-background"
              }`}
            >
              {c.title}
            </Link>
          ))}
        </nav>
      )}
    </aside>
  );
}

"use client";

import Link from "next/link";
import { useTripAssistant } from "../trip-assistant-provider";

export function ConversationSidebar({ activeId }: { activeId?: string }) {
  const { conversations, listStatus } = useTripAssistant();

  return (
    <aside className="flex w-full flex-col gap-3 border-b border-zinc-200 p-4 md:w-64 md:shrink-0 md:border-r md:border-b-0 dark:border-zinc-800">
      <Link
        href="/trip-assistant"
        className="rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-emerald-700"
      >
        + New question
      </Link>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Your conversations
      </p>
      {conversations.length === 0 && listStatus === "loading" ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : conversations.length === 0 && listStatus === "error" ? (
        <p className="text-sm text-rose-700 dark:text-rose-300">Could not load conversations.</p>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-zinc-500">No conversations yet.</p>
      ) : (
        <nav className="flex max-h-48 flex-col gap-1 overflow-y-auto md:max-h-none">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/trip-assistant/${c.id}`}
              aria-current={c.id === activeId ? "page" : undefined}
              className={`truncate rounded-md px-2 py-1.5 text-sm ${
                c.id === activeId
                  ? "bg-zinc-200 font-medium dark:bg-zinc-800"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTripAssistant } from "../trip-assistant-provider";

export function ConversationSidebar({ activeId }: { activeId?: string }) {
  const router = useRouter();
  const { conversations, listStatus, deleteConversation } = useTripAssistant();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete this conversation?\n\n"${title}"`)) return;
    setDeleteError(null);
    const ok = await deleteConversation(id);
    if (!ok) {
      setDeleteError("Could not delete. Please try again.");
      return;
    }
    // Leave the page of a conversation that no longer exists.
    if (id === activeId) router.push("/trip-assistant");
  }

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
      {deleteError && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          {deleteError}
        </p>
      )}
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
            <div
              key={c.id}
              className={`group flex items-center rounded-lg transition ${
                c.id === activeId
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                  : "hover:bg-background"
              }`}
            >
              <Link
                href={`/trip-assistant/${c.id}`}
                aria-current={c.id === activeId ? "page" : undefined}
                className={`min-w-0 flex-1 truncate px-3 py-2 text-sm ${
                  c.id === activeId ? "font-medium" : ""
                }`}
              >
                {c.title}
              </Link>
              {/* Always visible on touch screens; on desktop appears on hover or keyboard focus. */}
              <button
                type="button"
                onClick={() => remove(c.id, c.title)}
                aria-label={`Delete conversation: ${c.title}`}
                className="mr-1 shrink-0 rounded-md p-1.5 text-muted transition hover:bg-rose-100 hover:text-rose-700 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-rose-950 dark:hover:text-rose-300"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          ))}
        </nav>
      )}
    </aside>
  );
}

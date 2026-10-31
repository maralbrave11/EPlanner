"use client";

import { useRouter } from "next/navigation";
import { EXAMPLE_QUESTIONS } from "../mock-data";
import { useTripAssistant } from "../trip-assistant-provider";
import { QuestionInput } from "./question-input";
import { TripAssistantShell } from "./trip-assistant-shell";

/** /trip-assistant — empty state with example questions. */
export function NewConversation() {
  const router = useRouter();
  const { startConversation } = useTripAssistant();

  function ask(question: string) {
    const id = startConversation(question);
    router.push(`/trip-assistant/${id}`);
  }

  return (
    <TripAssistantShell>
      <div className="flex flex-1 flex-col justify-center gap-8 py-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Ask a travel question</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Get one clear recommendation plus a few options with estimated prices.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="rounded-xl border border-zinc-200 p-3 text-left text-sm hover:border-emerald-500 hover:bg-emerald-50 dark:border-zinc-800 dark:hover:bg-emerald-950"
            >
              {q}
            </button>
          ))}
        </div>

        <QuestionInput onSubmit={ask} />
      </div>
    </TripAssistantShell>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { EXAMPLE_QUESTIONS } from "../example-questions";
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
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Where to next?
            <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Ask a travel question.
            </span>
          </h1>
          <p className="mt-3 text-muted">
            Get one clear recommendation plus a few options with estimated prices.
          </p>
        </div>

        <QuestionInput onSubmit={ask} />

        <div>
          <h2 className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
            Or try one of these
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-2xl border border-line bg-surface p-3.5 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </TripAssistantShell>
  );
}

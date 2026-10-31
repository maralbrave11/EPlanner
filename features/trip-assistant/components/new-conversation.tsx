"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { EXAMPLE_QUESTION_KEYS } from "../example-questions";
import { useTripAssistant } from "../trip-assistant-provider";
import { QuestionInput } from "./question-input";
import { TripAssistantShell } from "./trip-assistant-shell";

/** /trip-assistant — empty state with example questions. */
export function NewConversation() {
  const router = useRouter();
  const { t } = useI18n();
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
            {t("new.title1")}
            <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text pb-1 text-transparent">
              {t("new.title2")}
            </span>
          </h1>
          <p className="mt-3 text-muted">{t("new.subtitle")}</p>
        </div>

        <QuestionInput onSubmit={ask} />

        <div>
          <h2 className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
            {t("new.orTry")}
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {EXAMPLE_QUESTION_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => ask(t(key))}
                className="rounded-2xl border border-line bg-surface p-3.5 text-start text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </TripAssistantShell>
  );
}

import { formatPriceRange } from "../format-price";
import type { AssistantAnswer, PriceRange } from "../types";

function PriceTag({ price }: { price: PriceRange }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
      {formatPriceRange(price)}
      <span className="text-xs font-normal opacity-70">estimated</span>
    </span>
  );
}

type AnswerCardProps = {
  answer: AssistantAnswer;
  /** Called when the user wants to explore an option. Omit to hide the buttons. */
  onPickOption?: (title: string) => void;
  /** Called when the user wants to reply to the follow-up question. */
  onAnswerFollowUp?: (question: string) => void;
  disabled?: boolean;
};

export function AnswerCard({ answer, onPickOption, onAnswerFollowUp, disabled }: AnswerCardProps) {
  const { summary, recommendation, options, followUpQuestion } = answer;
  const hasPrices = Boolean(recommendation.price || options.some((o) => o.price));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-zinc-800 dark:text-zinc-200">{summary}</p>

      {/* Recommendation */}
      <section className="rounded-xl border-2 border-emerald-500 bg-white p-4 dark:bg-zinc-900">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Our recommendation
        </p>
        <h3 className="text-lg font-semibold">{recommendation.title}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{recommendation.reason}</p>
        {recommendation.price && (
          <div className="mt-3">
            <PriceTag price={recommendation.price} />
          </div>
        )}
      </section>

      {/* Options */}
      {options.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Other options
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((option) => (
              <article
                key={option.title}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h4 className="font-semibold">{option.title}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{option.description}</p>
                {option.price && (
                  <div>
                    <PriceTag price={option.price} />
                  </div>
                )}
                <ul className="text-sm">
                  {option.pros.map((pro) => (
                    <li key={pro} className="text-emerald-700 dark:text-emerald-400">
                      + {pro}
                    </li>
                  ))}
                  {option.cons.map((con) => (
                    <li key={con} className="text-rose-700 dark:text-rose-400">
                      − {con}
                    </li>
                  ))}
                </ul>
                {onPickOption && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPickOption(option.title)}
                    className="mt-auto self-start rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Tell me more
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Follow-up question */}
      {followUpQuestion && (
        <section className="flex flex-wrap items-center gap-3 rounded-xl bg-sky-50 p-4 dark:bg-sky-950">
          <p className="flex-1 text-sm text-sky-900 dark:text-sky-200">
            <span className="font-semibold">To improve this answer: </span>
            {followUpQuestion}
          </p>
          {onAnswerFollowUp && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAnswerFollowUp(followUpQuestion)}
              className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              Answer
            </button>
          )}
        </section>
      )}

      {hasPrices && (
        <p className="text-xs text-zinc-500">Prices are estimates and may differ.</p>
      )}
    </div>
  );
}

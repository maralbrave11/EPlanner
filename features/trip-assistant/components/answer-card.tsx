import { formatPriceRange } from "../format-price";
import type { OptionsAnswer, PriceRange } from "../types";

export function PriceTag({ price }: { price: PriceRange }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900">
      {formatPriceRange(price)}
      <span className="text-[11px] font-medium tracking-wide uppercase opacity-60">est.</span>
    </span>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone: "pro" | "con" }) {
  return (
    <li
      className={`flex items-start gap-1.5 text-sm ${
        tone === "pro" ? "text-emerald-800 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
      }`}
    >
      <span aria-hidden className="mt-0.5 font-bold">
        {tone === "pro" ? "+" : "−"}
      </span>
      <span>{children}</span>
    </li>
  );
}

type AnswerCardProps = {
  answer: OptionsAnswer;
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
    <div className="rise-in flex flex-col gap-4">
      <p className="text-[15px] leading-relaxed text-pretty">{summary}</p>

      {/* Recommendation */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-surface to-surface p-5 shadow-sm dark:border-emerald-800 dark:from-emerald-950">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
            <path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6L12 2Z" />
          </svg>
          Best pick
        </span>
        <h3 className="text-xl font-semibold tracking-tight">{recommendation.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{recommendation.reason}</p>
        {recommendation.price && (
          <div className="mt-3.5">
            <PriceTag price={recommendation.price} />
          </div>
        )}
      </section>

      {/* Options */}
      {options.length > 0 && (
        <section>
          <h4 className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
            Other options
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((option) => (
              <article
                key={option.title}
                className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <h5 className="font-semibold">{option.title}</h5>
                <p className="text-sm leading-relaxed text-muted">{option.description}</p>
                {option.price && (
                  <div>
                    <PriceTag price={option.price} />
                  </div>
                )}
                <ul className="flex flex-col gap-1">
                  {option.pros.map((pro) => (
                    <Chip key={pro} tone="pro">
                      {pro}
                    </Chip>
                  ))}
                  {option.cons.map((con) => (
                    <Chip key={con} tone="con">
                      {con}
                    </Chip>
                  ))}
                </ul>
                {onPickOption && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPickOption(option.title)}
                    className="mt-auto self-start rounded-full border border-line px-3.5 py-1.5 text-sm font-medium transition hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50 dark:hover:text-emerald-300"
                  >
                    Tell me more →
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Follow-up question */}
      {followUpQuestion && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950">
          <p className="min-w-48 flex-1 text-sm leading-relaxed text-sky-900 dark:text-sky-100">
            <span className="font-semibold">To improve this answer: </span>
            {followUpQuestion}
          </p>
          {onAnswerFollowUp && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAnswerFollowUp(followUpQuestion)}
              className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
            >
              Answer
            </button>
          )}
        </section>
      )}

      {hasPrices && (
        <p className="text-xs text-muted">Prices are estimates and may differ.</p>
      )}
    </div>
  );
}

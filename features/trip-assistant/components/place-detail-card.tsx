import type { PlaceDetailAnswer } from "../types";
import { PriceTag } from "./answer-card";

type PlaceDetailCardProps = {
  answer: PlaceDetailAnswer;
  /** User wants a suggested visiting order. Omit to hide the offer. */
  onWantRoute?: () => void;
  /** User declines the route offer. */
  onDeclineRoute?: () => void;
  disabled?: boolean;
};

/** "Tell me more" reply: what is inside the place, practical facts, and a route offer. */
export function PlaceDetailCard({
  answer,
  onWantRoute,
  onDeclineRoute,
  disabled,
}: PlaceDetailCardProps) {
  const { title, summary, sections, facts, price, caveat, routeQuestion } = answer;

  return (
    <div className="rise-in flex flex-col gap-4">
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <span className="mb-2 inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-sky-800 uppercase dark:bg-sky-950 dark:text-sky-200">
          More about this place
        </span>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{summary}</p>
        {price && (
          <div className="mt-3.5">
            <PriceTag price={price} />
          </div>
        )}
        {facts.length > 0 && (
          <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.label} className="text-sm">
                <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {fact.label}
                </dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {sections.map((section) => (
        <section key={section.heading}>
          <h4 className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
            {section.heading}
          </h4>
          <ul className="grid gap-2 sm:grid-cols-2">
            {section.items.map((item) => (
              <li
                key={item.name}
                className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm shadow-sm"
              >
                <span className="font-medium">{item.name}</span>
                {item.note && <span className="block text-muted">{item.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {caveat && <p className="text-xs text-muted">{caveat}</p>}

      {(onWantRoute || onDeclineRoute) && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950">
          <p className="min-w-48 flex-1 text-sm leading-relaxed text-sky-900 dark:text-sky-100">
            {routeQuestion}
          </p>
          <div className="flex gap-2">
            {onWantRoute && (
              <button
                type="button"
                disabled={disabled}
                onClick={onWantRoute}
                className="rounded-full bg-sky-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
              >
                Yes, plan my route
              </button>
            )}
            {onDeclineRoute && (
              <button
                type="button"
                disabled={disabled}
                onClick={onDeclineRoute}
                className="rounded-full border border-sky-300 px-4 py-1.5 text-sm font-medium transition hover:bg-sky-100 disabled:opacity-50 dark:border-sky-800 dark:hover:bg-sky-900"
              >
                No thanks
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

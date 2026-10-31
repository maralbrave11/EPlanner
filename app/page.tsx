import Link from "next/link";

const STEPS = [
  {
    title: "Ask anything",
    text: "Where to stay, how to get around, what to do. Type it like you would ask a friend.",
  },
  {
    title: "Get one clear pick",
    text: "A single recommendation with the reason why, so you can decide fast.",
  },
  {
    title: "Compare options",
    text: "A few alternatives with estimated prices, pros and cons, and a follow-up to fine-tune.",
  },
];

const EXAMPLES = [
  "Where should I stay in Tokyo for 3 nights on a mid budget?",
  "How do I get from the airport to the city center in Seoul?",
  "What can I do in Ulaanbaatar in winter?",
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="hero-glow">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 pt-20 pb-16 text-center sm:pt-28">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Free AI travel assistant
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Plan smarter trips.
            <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Save money and time.
            </span>
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted">
            Ask any travel question and get a clear recommendation plus a few options with
            estimated prices. No hours of research.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/trip-assistant"
              className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3 font-medium text-white shadow-lg shadow-emerald-600/20 transition hover:shadow-xl hover:shadow-emerald-600/30"
            >
              Ask a travel question
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full border border-line bg-surface px-7 py-3 font-medium hover:border-emerald-500"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-4xl px-6 py-14">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {i + 1}
              </span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 pb-20">
        <h2 className="mb-4 text-center text-sm font-semibold tracking-wide text-muted uppercase">
          Try asking
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((q) => (
            <Link
              key={q}
              href="/trip-assistant"
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              {q}
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-line px-6 py-6 text-center text-xs text-muted">
        Prices are estimates and may differ. SmartTrip does not sell or book anything.
      </footer>
    </main>
  );
}

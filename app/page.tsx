import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">
        Plan smarter trips. Save money and time.
      </h1>
      <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
        Ask anything about your trip. SmartTrip gives you a clear
        recommendation plus a few options with estimated prices — and refines
        them as you answer follow-up questions.
      </p>
      <Link
        href="/trip-assistant"
        className="rounded-full bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
      >
        Ask a travel question
      </Link>
    </main>
  );
}

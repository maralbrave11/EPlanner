"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/i18n-provider";

const STEPS = [1, 2, 3] as const;
const EXAMPLES = ["ex.1", "ex.2", "ex.3"] as const;

const TOOLS = [
  {
    href: "/trip-assistant",
    icon: "💬",
    title: "tabs.chat",
    text: "new.subtitle",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    href: "/trip-planner",
    icon: "🗺️",
    title: "tabs.planner",
    text: "pl.subtitle",
    gradient: "from-orange-400 to-rose-500",
  },
  {
    href: "/events",
    icon: "🎟️",
    title: "tabs.events",
    text: "ev.subtitle",
    gradient: "from-violet-500 to-fuchsia-500",
  },
] as const;

/** Decorative travel scene, full width: sun, clouds, mountains, sea, and a plane on a dotted flight path. */
function HeroScene() {
  return (
    <svg
      viewBox="0 0 1440 260"
      preserveAspectRatio="xMidYMax slice"
      className="block h-44 w-full sm:h-60"
      aria-hidden
    >
      <defs>
        <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <circle cx="1090" cy="92" r="46" fill="url(#sun)" opacity="0.95" />
      <g className="drift" fill="#fff" opacity="0.9">
        <ellipse cx="210" cy="70" rx="44" ry="15" />
        <ellipse cx="240" cy="60" rx="30" ry="13" />
      </g>
      <g className="drift-slow" fill="#fff" opacity="0.8">
        <ellipse cx="620" cy="46" rx="36" ry="12" />
        <ellipse cx="646" cy="38" rx="24" ry="10" />
      </g>
      <g className="drift" fill="#fff" opacity="0.85">
        <ellipse cx="1290" cy="64" rx="40" ry="14" />
        <ellipse cx="1316" cy="55" rx="26" ry="11" />
      </g>
      <g className="drift-slow" fill="#fff" opacity="0.75">
        <ellipse cx="880" cy="118" rx="28" ry="10" />
        <ellipse cx="900" cy="112" rx="18" ry="8" />
      </g>
      <path d="M0 190 L140 100 L240 160 L380 70 L520 170 L660 110 L800 180 L960 120 L1100 185 L1240 105 L1440 170 L1440 260 L0 260Z" fill="#6366f1" opacity="0.55" />
      <path d="M0 215 L170 150 L300 200 L460 140 L620 212 L780 160 L950 215 L1120 155 L1280 210 L1440 175 L1440 260 L0 260Z" fill="#3b82f6" opacity="0.75" />
      <rect x="0" y="222" width="1440" height="38" fill="url(#sea)" />
      <path d="M0 232 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" fill="none" />
      {/* Flight path: dotted line with the starting point and the plane at the far end */}
      <path
        className="dash-flow"
        d="M80 212 C 360 40, 760 10, 960 66"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 10"
        fill="none"
      />
      <circle cx="80" cy="212" r="6" fill="#fff" stroke="#f97316" strokeWidth="3" />
      <g className="float">
        <g transform="translate(960 66) rotate(106) scale(3) translate(-12 -12)">
          <path
            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
            fill="#fff"
            stroke="#1d4ed8"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}

/** Landing page body. Client component because the text depends on the chosen language. */
export function HomeContent() {
  const { t } = useI18n();

  return (
    <main className="flex flex-1 flex-col">
      <section className="hero-glow">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 pt-20 pb-6 text-center sm:pt-28">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            {t("home.badge")}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {t("home.title1")}
            <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text pb-1 text-transparent">
              {t("home.title2")}
            </span>
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted">{t("home.subtitle")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/trip-assistant"
              className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3 font-medium text-white shadow-lg shadow-emerald-600/20 transition hover:shadow-xl hover:shadow-emerald-600/30"
            >
              {t("home.cta")}
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full border border-line bg-surface px-7 py-3 font-medium hover:border-emerald-500"
            >
              {t("home.howLink")}
            </Link>
          </div>
        </div>
        <HeroScene />
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="lift flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.gradient} text-2xl shadow-md`}
                aria-hidden
              >
                {tool.icon}
              </span>
              <h3 className="text-lg font-semibold">{t(tool.title)}</h3>
              <p className="line-clamp-3 text-sm text-muted">{t(tool.text)}</p>
              <span className="mt-auto text-sm font-medium text-emerald-700 dark:text-emerald-300">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-4xl px-6 py-14">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
          {t("home.howTitle")}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((n) => (
            <li key={n} className="lift rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-semibold text-white shadow">
                {n}
              </span>
              <h3 className="font-semibold">{t(`home.step${n}Title`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`home.step${n}Text`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 pb-20">
        <h2 className="mb-4 text-center text-sm font-semibold tracking-wide text-muted uppercase">
          {t("home.tryAsking")}
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((key) => (
            <Link
              key={key}
              href="/trip-assistant"
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              {t(key)}
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-line px-6 py-6 text-center text-xs text-muted">
        {t("home.footer")}
      </footer>
    </main>
  );
}

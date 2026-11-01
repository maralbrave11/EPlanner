"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/i18n-provider";

const TABS = [
  { href: "/trip-assistant", key: "tabs.chat" },
  { href: "/trip-planner", key: "tabs.planner" },
  { href: "/events", key: "tabs.events" },
] as const;

/** Switch between the three tools: chat, trip planner, events. */
export function FeatureNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav aria-label={t("tabs.aria")} className="flex gap-1 rounded-xl bg-background p-1 ring-1 ring-line">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 rounded-lg px-2 py-1.5 text-center text-sm transition ${
              active
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 font-medium text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}

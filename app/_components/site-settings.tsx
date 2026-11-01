"use client";

// Site settings from public.site_settings (banner message + tool on/off switches).
// Set by the admin (/admin). Everyone can read them. The server also enforces the switches.
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, parseSettings, type SiteSettings, type ToolId } from "@/lib/admin/settings";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { createClient } from "@/lib/supabase/client";

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const SettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    createClient()
      .from("site_settings")
      .select("key, value")
      .then(({ data, error }) => {
        // If the table is missing (sql/admin.sql not run), keep the defaults.
        if (!cancelled && !error) setSettings(parseSettings(data));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SettingsContext value={settings}>{children}</SettingsContext>;
}

/** The message from the site owner, shown under the header when it is switched on. */
export function SiteBanner() {
  const { banner } = useContext(SettingsContext);
  if (!banner.enabled || !banner.text.trim()) return null;
  return (
    <div
      role="status"
      className="border-b border-orange-200 bg-orange-50 px-4 py-2 text-center text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100"
    >
      {banner.text}
    </div>
  );
}

/** Shows its children, or a "temporarily unavailable" card when the admin switched the tool off. */
export function FeatureGate({ tool, children }: { tool: ToolId; children: React.ReactNode }) {
  const { features } = useContext(SettingsContext);
  const { t } = useI18n();
  if (features[tool]) return <>{children}</>;
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span aria-hidden className="text-4xl">
        🛠️
      </span>
      <h1 className="text-xl font-semibold">{t("off.title")}</h1>
      <p className="text-muted">{t("err.featureOff")}</p>
    </div>
  );
}

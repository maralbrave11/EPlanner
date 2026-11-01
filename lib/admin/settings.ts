// Site settings shared by the browser and the server (stored in public.site_settings).

export const TOOL_IDS = ["trip-assistant", "trip-planner", "events"] as const;
export type ToolId = (typeof TOOL_IDS)[number];

export type SiteSettings = {
  banner: { enabled: boolean; text: string };
  features: Record<ToolId, boolean>;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  banner: { enabled: false, text: "" },
  features: { "trip-assistant": true, "trip-planner": true, events: true },
};

/** Turns the rows of `site_settings` into settings, using defaults for anything missing. */
export function parseSettings(rows: { key: string; value: unknown }[] | null): SiteSettings {
  const out: SiteSettings = {
    banner: { ...DEFAULT_SETTINGS.banner },
    features: { ...DEFAULT_SETTINGS.features },
  };
  for (const row of rows ?? []) {
    const v = row.value as Record<string, unknown> | null;
    if (!v || typeof v !== "object") continue;
    if (row.key === "banner") {
      out.banner = { enabled: v.enabled === true, text: typeof v.text === "string" ? v.text : "" };
    } else if (row.key === "features") {
      for (const id of TOOL_IDS) if (typeof v[id] === "boolean") out.features[id] = v[id];
    }
  }
  return out;
}

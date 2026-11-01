// Server-only helpers for the AI routes: block check, tool on/off switch, activity log.
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { parseSettings, type ToolId } from "./settings";

/**
 * Returns an error response when the user is blocked or the tool is switched off,
 * otherwise null. `supabase` is the signed-in user's client (RLS: own flag, public settings).
 * If the admin tables are missing (sql/admin.sql not run yet) it lets the request through.
 */
export async function checkAccess(
  supabase: SupabaseClient,
  userId: string,
  tool?: ToolId,
): Promise<NextResponse | null> {
  const [flag, settings] = await Promise.all([
    supabase.from("user_flags").select("blocked").eq("user_id", userId).maybeSingle(),
    tool ? supabase.from("site_settings").select("key, value") : Promise.resolve({ data: null }),
  ]);
  if (flag.data?.blocked) {
    return NextResponse.json(
      { error: "Your account has been blocked. Contact the site owner.", code: "blocked" },
      { status: 403 },
    );
  }
  if (tool && !parseSettings(settings.data).features[tool]) {
    return NextResponse.json(
      { error: "This tool is temporarily unavailable.", code: "featureOff" },
      { status: 503 },
    );
  }
  return null;
}

export type ActivityKind = "assistant" | "planner-suggest" | "planner-plan" | "events";

/** Records what the user asked for. Never fails the request: problems are only logged. */
export async function logActivity(
  supabase: SupabaseClient,
  userId: string,
  kind: ActivityKind,
  summary: string,
  details?: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("activity_log")
    .insert({ user_id: userId, kind, summary: summary.slice(0, 500), details: details ?? null });
  if (error) console.error("activity log failed", error.message);
}

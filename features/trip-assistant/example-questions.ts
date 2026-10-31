import type { MessageKey } from "@/lib/i18n/messages";

// Clickable starter questions on the empty /trip-assistant page.
// The texts live in lib/i18n/messages/<language>.ts (keys ex.1 ... ex.4).
export const EXAMPLE_QUESTION_KEYS = ["ex.1", "ex.2", "ex.3", "ex.4"] as const satisfies readonly MessageKey[];

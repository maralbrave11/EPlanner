// Client-safe helpers: pull every user-visible string out of an AI answer, and put
// translated strings back in the same places. Numbers, codes and dates are left alone.

/** Keys whose string values are codes or dates, not text to translate. */
const SKIP_KEYS = new Set(["kind", "currency", "date", "lang"]);

export function collectStrings(value: unknown, out: string[] = [], key?: string): string[] {
  if (typeof value === "string") {
    if (!key || !SKIP_KEYS.has(key)) out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out, key);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) collectStrings(v, out, k);
  }
  return out;
}

/** Same walk as `collectStrings`, replacing each string with the next translated one. */
export function replaceStrings<T>(value: T, strings: string[]): T {
  let i = 0;
  function walk(v: unknown, key?: string): unknown {
    if (typeof v === "string") return !key || !SKIP_KEYS.has(key) ? (strings[i++] ?? v) : v;
    if (Array.isArray(v)) return v.map((item) => walk(item, key));
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, walk(val, k)]));
    }
    return v;
  }
  return walk(value) as T;
}

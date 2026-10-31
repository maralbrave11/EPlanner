// Shapes used by the trip-assistant feature.
// The AI answer formats are documented in docs/plan.md §5.

export type PriceRange = {
  min: number;
  max: number;
  currency: string;
  /** e.g. "per night", "per person", "one way" */
  unit?: string;
};

export type AssistantRecommendation = {
  title: string;
  reason: string;
  price?: PriceRange;
};

export type AssistantOption = {
  title: string;
  description: string;
  price?: PriceRange;
  pros: string[];
  cons: string[];
};

/** Normal answer: one recommendation + several options. (`kind` is missing on older saved answers.) */
export type OptionsAnswer = {
  kind?: "options";
  summary: string;
  recommendation: AssistantRecommendation;
  options: AssistantOption[];
  followUpQuestion?: string;
};

/** Reply to "Tell me more" about one place: what is inside it, plus an offer to plan a route. */
export type PlaceDetailAnswer = {
  kind: "detail";
  title: string;
  summary: string;
  /** e.g. { heading: "Stores and brands", items: [{ name: "Nike", note: "Factory outlet" }] } */
  sections: { heading: string; items: { name: string; note?: string }[] }[];
  /** Short practical facts, e.g. { label: "Best time", value: "Weekday mornings" } */
  facts: { label: string; value: string }[];
  price?: PriceRange;
  /** Honest note when details may be out of date. */
  caveat?: string;
  /** Question offering a suggested visiting order. */
  routeQuestion: string;
};

/** Reply after the user says yes to the route offer. */
export type RouteAnswer = {
  kind: "route";
  title: string;
  summary: string;
  steps: { name: string; why: string; minutes?: number; tip?: string }[];
  totalMinutes?: number;
  tips: string[];
};

export type AssistantAnswer = OptionsAnswer | PlaceDetailAnswer | RouteAnswer;

/** What the user is asking for: a normal question, details about a place, or a visiting order. */
export type AssistantMode = "ask" | "detail" | "route";

export type AssistantMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; answer: AssistantAnswer };

export type AssistantConversation = {
  id: string;
  title: string;
  /** undefined = not loaded from the database yet */
  messages?: AssistantMessage[];
};

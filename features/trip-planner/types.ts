// Shapes used by the trip-planner feature (docs/plan.md §5.4).
import type { PriceRange } from "@/features/trip-assistant/types";

/** Interest ids the traveler can pick. Labels live in lib/i18n/messages (int.*). */
export const INTEREST_IDS = [
  "sights",
  "food",
  "shopping",
  "nature",
  "culture",
  "nightlife",
  "adventure",
  "relax",
  "family",
] as const;
export type InterestId = (typeof INTEREST_IDS)[number];

export type PlannerTrip = {
  destination: string;
  startDate: string;
  endDate: string;
};

export type SuggestedPlace = {
  title: string;
  description: string;
  /** Which of the traveler's interests it matches (free text, in the answer language). */
  matches: string;
  /** Where to get more details: official site, ticket seller, tourism board (names, no made-up links). */
  moreInfo: string;
  price?: PriceRange;
  pros: string[];
  cons: string[];
};

export type Happening = {
  name: string;
  kind: "event" | "sale" | "festival";
  where: string;
  when: string;
  description: string;
  /** Where to get more details (organizer, ticket site, tourism board). */
  moreInfo: string;
};

/** Reply to step 2: places to see + events/sales during the trip + an offer to plan. */
export type SuggestionsAnswer = {
  summary: string;
  places: SuggestedPlace[];
  happenings: Happening[];
  caveat: string;
  /** Question offering a day-by-day plan. */
  planQuestion: string;
};

export type PlanStop = {
  name: string;
  /** e.g. "09:00" or "Morning" */
  time?: string;
  note: string;
  minutes?: number;
};

export type PlanDay = {
  title: string;
  date?: string;
  stops: PlanStop[];
};

/** Reply after "Yes, make a plan": day by day, in the order to travel. */
export type PlanAnswer = {
  title: string;
  summary: string;
  days: PlanDay[];
  tips: string[];
};

// Shapes used by the events feature (docs/plan.md §5.3).
import type { PriceRange } from "@/features/trip-assistant/types";

export type EventItem = {
  name: string;
  /** e.g. "Festival", "Concert", "Sale", "Market" */
  category: string;
  /** Venue or area. */
  where: string;
  /** Date or usual period, e.g. "usually mid-July". */
  when: string;
  description: string;
  /** Where to get more details: organizer, ticket site, tourism board (names, no made-up links). */
  moreInfo: string;
  price?: PriceRange;
};

export type EventsAnswer = {
  summary: string;
  events: EventItem[];
  /** Honest note: dates change, check the official website. */
  caveat: string;
};

export type EventsRequest = {
  destination: string;
  startDate: string;
  endDate: string;
};

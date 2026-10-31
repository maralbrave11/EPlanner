// Shapes used by the trip-assistant feature.
// The AI answer format matches docs/plan.md §5.

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

export type AssistantAnswer = {
  summary: string;
  recommendation: AssistantRecommendation;
  options: AssistantOption[];
  followUpQuestion?: string;
};

export type AssistantMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; answer: AssistantAnswer };

export type AssistantConversation = {
  id: string;
  title: string;
  /** undefined = not loaded from the database yet */
  messages?: AssistantMessage[];
};

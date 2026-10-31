// Stage 1 mock data only. Replaced by Claude + Supabase in Stage 3.
import type { AssistantAnswer, AssistantConversation } from "./types";

export const EXAMPLE_QUESTIONS = [
  "Where should I stay in Tokyo for 3 nights on a mid budget?",
  "How do I get from the airport to the city center in Seoul?",
  "What can I do in Ulaanbaatar in winter?",
  "Is it cheaper to travel by train or bus from Beijing to Shanghai?",
];

const STAY_ANSWER: AssistantAnswer = {
  summary:
    "For a short first visit on a mid budget, stay close to a major transit hub so you save time getting around.",
  recommendation: {
    title: "Stay near Shinjuku Station",
    reason:
      "Best train connections in the city, lots of mid-range hotels, and easy airport access.",
    price: { min: 90, max: 150, currency: "USD", unit: "per night" },
  },
  options: [
    {
      title: "Asakusa",
      description: "Traditional neighborhood with temples and a calmer feel.",
      price: { min: 60, max: 110, currency: "USD", unit: "per night" },
      pros: ["Cheaper hotels", "Historic sights nearby"],
      cons: ["Farther from nightlife", "Fewer direct train lines"],
    },
    {
      title: "Ueno",
      description: "Budget-friendly area with parks, museums, and a direct airport train.",
      price: { min: 55, max: 100, currency: "USD", unit: "per night" },
      pros: ["Direct airport train", "Good value"],
      cons: ["Less lively at night"],
    },
    {
      title: "Shibuya",
      description: "Busy, trendy area full of shops and restaurants.",
      price: { min: 110, max: 190, currency: "USD", unit: "per night" },
      pros: ["Very central", "Great food and shopping"],
      cons: ["More expensive", "Crowded"],
    },
  ],
  followUpQuestion: "Do you prefer a lively area or a quieter one?",
};

const TRANSPORT_ANSWER: AssistantAnswer = {
  summary:
    "The airport express train is usually the best mix of price and speed. Taxis are much more expensive.",
  recommendation: {
    title: "Take the airport express train",
    reason: "Fast, predictable travel time, and much cheaper than a taxi.",
    price: { min: 7, max: 10, currency: "USD", unit: "per person" },
  },
  options: [
    {
      title: "Airport limousine bus",
      description: "Comfortable bus that stops at major hotels.",
      price: { min: 12, max: 17, currency: "USD", unit: "per person" },
      pros: ["Drops you near many hotels", "Space for luggage"],
      cons: ["Slower in traffic"],
    },
    {
      title: "Subway (all-stop line)",
      description: "Regular metro line with more stops.",
      price: { min: 3, max: 5, currency: "USD", unit: "per person" },
      pros: ["Cheapest option"],
      cons: ["Slowest", "Hard with big luggage"],
    },
    {
      title: "Taxi or rideshare",
      description: "Door-to-door, best for groups or late arrivals.",
      price: { min: 45, max: 80, currency: "USD", unit: "per car" },
      pros: ["Door-to-door", "Good for 3–4 people"],
      cons: ["Most expensive", "Traffic delays"],
    },
  ],
  followUpQuestion: "How many people are traveling, and how much luggage do you have?",
};

const ACTIVITIES_ANSWER: AssistantAnswer = {
  summary:
    "Winter is cold but full of unique experiences. Plan indoor stops between outdoor activities.",
  recommendation: {
    title: "Day trip to Terelj National Park",
    reason:
      "Snowy landscapes, horse or camel rides, and a ger visit, all within about 1.5 hours of the city.",
    price: { min: 40, max: 90, currency: "USD", unit: "per person" },
  },
  options: [
    {
      title: "Gandan Monastery and city museums",
      description: "Warm indoor culture day in the city.",
      price: { min: 5, max: 20, currency: "USD", unit: "per person" },
      pros: ["Cheap", "Stay warm indoors"],
      cons: ["Less adventurous"],
    },
    {
      title: "Ice festival on Khuvsgul Lake (seasonal)",
      description: "Ice sculptures, sports, and local culture, if dates match.",
      price: { min: 250, max: 500, currency: "USD", unit: "per person, multi-day trip" },
      pros: ["Once-in-a-lifetime experience"],
      cons: ["Far away", "Only on specific dates"],
    },
    {
      title: "Traditional concert and hot pot dinner",
      description: "Throat singing show followed by a warm local dinner.",
      price: { min: 20, max: 45, currency: "USD", unit: "per person" },
      pros: ["Great evening plan", "Indoors"],
      cons: ["Book tickets in advance"],
    },
  ],
  followUpQuestion: "How many days do you have, and are you OK with very cold weather (−20 °C)?",
};

const GENERAL_ANSWER: AssistantAnswer = {
  summary:
    "Here is a balanced suggestion. Tell me your dates, budget, and number of travelers for a more exact answer.",
  recommendation: {
    title: "Book a mid-range, centrally located option",
    reason: "Being central saves both transport money and travel time.",
  },
  options: [
    {
      title: "Budget choice",
      description: "Lowest price, a bit farther from the center.",
      pros: ["Saves money"],
      cons: ["More travel time"],
    },
    {
      title: "Comfort choice",
      description: "Higher price, best location and comfort.",
      pros: ["Saves time", "More comfortable"],
      cons: ["Costs more"],
    },
  ],
  followUpQuestion: "What are your travel dates and total budget?",
};

/** Picks a mock answer based on simple keywords in the question. */
export function pickMockAnswer(question: string): AssistantAnswer {
  const q = question.toLowerCase();
  if (/(stay|hotel|hostel|neighborhood|area|sleep)/.test(q)) return STAY_ANSWER;
  if (/(get from|airport|train|bus|taxi|metro|subway|transport|cheaper to travel)/.test(q))
    return TRANSPORT_ANSWER;
  if (/(do in|see|activit|things to|winter|summer|festival|event)/.test(q))
    return ACTIVITIES_ANSWER;
  return GENERAL_ANSWER;
}

export const MOCK_CONVERSATIONS: AssistantConversation[] = [
  {
    id: "mock-tokyo",
    title: "Where should I stay in Tokyo for 3 nights?",
    messages: [
      { id: "m1", role: "user", content: "Where should I stay in Tokyo for 3 nights?" },
      { id: "m2", role: "assistant", answer: STAY_ANSWER },
    ],
  },
  {
    id: "mock-ulaanbaatar",
    title: "What can I do in Ulaanbaatar in winter?",
    messages: [
      { id: "m3", role: "user", content: "What can I do in Ulaanbaatar in winter?" },
      { id: "m4", role: "assistant", answer: ACTIVITIES_ANSWER },
    ],
  },
];

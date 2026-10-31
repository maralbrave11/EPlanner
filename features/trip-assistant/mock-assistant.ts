// Stage 1: fake AI call with a short delay. Stage 3 replaces this with a
// request to the trip-assistant API route (Claude, server-side).
import { pickMockAnswer } from "./mock-data";
import type { AssistantAnswer } from "./types";

const MOCK_DELAY_MS = 1200;

export async function askMockAssistant(question: string): Promise<AssistantAnswer> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  // Lets you preview the error state: include "error" in your question.
  if (/\berror\b/i.test(question)) {
    throw new Error("The assistant could not answer right now. Please try again.");
  }

  return pickMockAnswer(question);
}

// Shapes returned by GET /api/admin (docs/features/admin.md).
import type { AssistantAnswer } from "@/features/trip-assistant/types";

export type AdminUserRow = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  blocked: boolean;
  isAdmin: boolean;
  /** Conversations still visible to the user. */
  conversations: number;
  /** Conversations the user deleted (hidden from them, kept here). */
  deletedConversations: number;
  activity: number;
  ratings: { page: string; rating: number }[];
};

export type RatingSummary = { page: string; average: number; count: number };

export type UsersView = { users: AdminUserRow[]; ratings: RatingSummary[] };

export type AdminMessage = {
  id: string;
  role: "user" | "assistant";
  content: string | null;
  answer: AssistantAnswer | null;
  createdAt: string;
};

export type AdminConversation = {
  id: string;
  title: string;
  createdAt: string;
  /** Set when the user deleted it. */
  deletedAt: string | null;
  messages: AdminMessage[];
};

export type ActivityRow = {
  id: string;
  userId: string;
  email: string;
  kind: "assistant" | "planner-suggest" | "planner-plan" | "events";
  summary: string;
  createdAt: string;
};

export type UserDetailView = {
  user: AdminUserRow;
  conversations: AdminConversation[];
  activity: ActivityRow[];
};

export type ActivityView = { activity: ActivityRow[] };

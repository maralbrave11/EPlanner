// POST /api/feedback
// Body: { page: "trip-assistant" | "trip-planner" | "events", rating: 1-5 }
// Saves the signed-in user's star rating (rating again replaces the old one).
// Runs as a Vercel serverless function.
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAccess } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  page: z.enum(["trip-assistant", "trip-planner", "events"]),
  rating: z.number().int().min(1).max(5),
});

/** `code` lets the browser show the message in the user's language (err.* keys). */
function errorResponse(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(400, "badInput", "Invalid rating.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse(401, "login", "Please log in to ask questions.");

  const denied = await checkAccess(supabase, user.id);
  if (denied) return denied;

  const { error } = await supabase.from("feedback").upsert(
    { user_id: user.id, page: parsed.data.page, rating: parsed.data.rating, updated_at: new Date().toISOString() },
    { onConflict: "user_id,page" },
  );
  if (error) {
    console.error("feedback: save failed", error);
    return errorResponse(500, "save", "Could not save your rating. Please try again.");
  }
  return NextResponse.json({ saved: true });
}

// POST /api/events
// Body: { destination, startDate (YYYY-MM-DD), endDate, language? }
// Asks Claude what events/festivals/sales happen there in that period. Nothing is saved.
// Runs as a Vercel serverless function.
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAccess, logActivity } from "@/lib/admin/guard";
import { claudeErrorResponse, errorResponse } from "@/lib/ai/call-claude";
import { TripInputShape, validDateRange } from "@/lib/ai/trip-input";
import { askEvents } from "@/lib/events/claude";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const BodySchema = z.object(TripInputShape).refine(validDateRange);

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(400, "badTrip", "Please enter a place and valid dates (up to 30 days).");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse(401, "login", "Please log in to ask questions.");

  const denied = await checkAccess(supabase, user.id, "events");
  if (denied) return denied;

  const { language, ...trip } = parsed.data;
  try {
    const answer = await askEvents(trip, language);
    await logActivity(supabase, user.id, "events", `${trip.destination}, ${trip.startDate} → ${trip.endDate}`, trip);
    return NextResponse.json({ answer });
  } catch (err) {
    return claudeErrorResponse(err, "events");
  }
}

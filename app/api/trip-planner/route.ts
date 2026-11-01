// POST /api/trip-planner
// Body: { mode: "suggest" | "plan", destination, startDate, endDate, language?,
//         interests?: string[] (suggest), places?: string[] + happenings?: string[] (plan) }
//   suggest: places that match the interests + events/sales during the trip + offer to plan
//   plan:    day-by-day plan from the places the traveler chose
// Nothing is saved. Runs as a Vercel serverless function.
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAccess, logActivity } from "@/lib/admin/guard";
import { claudeErrorResponse, errorResponse } from "@/lib/ai/call-claude";
import { TripInputShape, validDateRange } from "@/lib/ai/trip-input";
import { INTEREST_IDS } from "@/features/trip-planner/types";
import { askPlan, askSuggestions } from "@/lib/trip-planner/claude";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const Name = z.string().trim().min(1).max(200);

const BodySchema = z
  .discriminatedUnion("mode", [
    z.object({
      ...TripInputShape,
      mode: z.literal("suggest"),
      interests: z.array(z.enum(INTEREST_IDS)).min(1).max(INTEREST_IDS.length),
    }),
    z.object({
      ...TripInputShape,
      mode: z.literal("plan"),
      places: z.array(Name).min(1).max(12),
      happenings: z.array(Name).max(8).default([]),
    }),
  ])
  .refine(validDateRange);

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

  const denied = await checkAccess(supabase, user.id, "trip-planner");
  if (denied) return denied;

  const body = parsed.data;
  const trip = { destination: body.destination, startDate: body.startDate, endDate: body.endDate };
  try {
    const answer =
      body.mode === "suggest"
        ? await askSuggestions(trip, body.interests, body.language)
        : await askPlan(trip, body.places, body.happenings, body.language);
    const where = `${trip.destination}, ${trip.startDate} → ${trip.endDate}`;
    await logActivity(
      supabase,
      user.id,
      body.mode === "suggest" ? "planner-suggest" : "planner-plan",
      body.mode === "suggest" ? `${where} · ${body.interests.join(", ")}` : `${where} · ${body.places.join(", ")}`,
      body.mode === "suggest" ? { ...trip, interests: body.interests } : { ...trip, places: body.places },
    );
    return NextResponse.json({ answer });
  } catch (err) {
    return claudeErrorResponse(err, "trip-planner");
  }
}

// /api/admin — admin only (emails in ADMIN_EMAILS). Uses the service role key, so every
// request first checks that the caller is an admin. Nothing here is reachable by normal users.
//   GET  ?view=me                → { admin: boolean }
//   GET  ?view=users             → users with counts + rating summary
//   GET  ?view=user&id=<uuid>    → one user: conversations (incl. deleted), messages, activity
//   GET  ?view=activity          → latest activity of everyone
//   GET  ?view=settings          → site settings (banner, tool switches)
//   POST { action: block | unblock | deleteUser, userId }
//        { action: deleteConversation, id }
//        { action: saveSettings, banner, features }
// Runs as a Vercel serverless function.
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  ActivityRow,
  AdminConversation,
  AdminMessage,
  AdminUserRow,
  RatingSummary,
} from "@/features/admin/types";
import type { AssistantAnswer } from "@/features/trip-assistant/types";
import { isAdminEmail, getAdminUser } from "@/lib/admin/is-admin";
import { parseSettings } from "@/lib/admin/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

type Admin = ReturnType<typeof createAdminClient>;

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** All users, 200 per request (stops after 25 pages = 5000 users). */
async function listAllUsers(admin: Admin): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 200) break;
  }
  return users;
}

async function buildUserRows(admin: Admin): Promise<{ rows: AdminUserRow[]; ratings: RatingSummary[] }> {
  const [users, convs, acts, fb, flags] = await Promise.all([
    listAllUsers(admin),
    admin.from("assistant_conversations").select("user_id, deleted_at"),
    admin.from("activity_log").select("user_id"),
    admin.from("feedback").select("user_id, page, rating"),
    admin.from("user_flags").select("user_id, blocked"),
  ]);
  for (const r of [convs, acts, fb, flags]) if (r.error) throw r.error;

  const count = (rows: { user_id: string }[] | null, id: string) =>
    (rows ?? []).filter((r) => r.user_id === id).length;
  const blockedIds = new Set((flags.data ?? []).filter((f) => f.blocked).map((f) => f.user_id));

  const rows = users.map((u): AdminUserRow => {
    const mine = (convs.data ?? []).filter((c) => c.user_id === u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      blocked: blockedIds.has(u.id),
      isAdmin: isAdminEmail(u.email),
      conversations: mine.filter((c) => !c.deleted_at).length,
      deletedConversations: mine.filter((c) => c.deleted_at).length,
      activity: count(acts.data, u.id),
      ratings: (fb.data ?? [])
        .filter((f) => f.user_id === u.id)
        .map((f) => ({ page: f.page as string, rating: f.rating as number })),
    };
  });
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const byPage = new Map<string, number[]>();
  for (const f of fb.data ?? []) byPage.set(f.page, [...(byPage.get(f.page) ?? []), f.rating]);
  const ratings = [...byPage].map(([page, list]) => ({
    page,
    count: list.length,
    average: Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 100) / 100,
  }));
  return { rows, ratings };
}

async function activityRows(admin: Admin, userId?: string): Promise<ActivityRow[]> {
  let query = admin
    .from("activity_log")
    .select("id, user_id, kind, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  const emails = new Map((await listAllUsers(admin)).map((u) => [u.id, u.email ?? ""]));
  return (data ?? []).map((a) => ({
    id: a.id,
    userId: a.user_id,
    email: emails.get(a.user_id) ?? "",
    kind: a.kind,
    summary: a.summary,
    createdAt: a.created_at,
  }));
}

export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get("view");
  const admin = await getAdminUser();
  if (view === "me") return NextResponse.json({ admin: Boolean(admin) });
  if (!admin) return fail(404, "Not found");

  try {
    const db = createAdminClient();

    if (view === "users") {
      const { rows, ratings } = await buildUserRows(db);
      return NextResponse.json({ users: rows, ratings });
    }

    if (view === "user") {
      const id = z.uuid().safeParse(new URL(request.url).searchParams.get("id"));
      if (!id.success) return fail(400, "Bad user id");
      const { rows } = await buildUserRows(db);
      const user = rows.find((r) => r.id === id.data);
      if (!user) return fail(404, "User not found");

      const { data: convs, error } = await db
        .from("assistant_conversations")
        .select("id, title, created_at, deleted_at")
        .eq("user_id", id.data)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const ids = (convs ?? []).map((c) => c.id);
      const { data: msgs, error: msgError } = ids.length
        ? await db
            .from("assistant_messages")
            .select("id, conversation_id, role, content, answer, created_at")
            .in("conversation_id", ids)
            .order("created_at", { ascending: true })
        : { data: [], error: null };
      if (msgError) throw msgError;

      const conversations = (convs ?? []).map(
        (c): AdminConversation => ({
          id: c.id,
          title: c.title,
          createdAt: c.created_at,
          deletedAt: c.deleted_at,
          messages: (msgs ?? [])
            .filter((m) => m.conversation_id === c.id)
            .map(
              (m): AdminMessage => ({
                id: m.id,
                role: m.role,
                content: m.content,
                answer: m.answer as AssistantAnswer | null,
                createdAt: m.created_at,
              }),
            ),
        }),
      );
      return NextResponse.json({ user, conversations, activity: await activityRows(db, id.data) });
    }

    if (view === "activity") return NextResponse.json({ activity: await activityRows(db) });

    if (view === "settings") {
      const { data, error } = await db.from("site_settings").select("key, value");
      if (error) throw error;
      return NextResponse.json({ settings: parseSettings(data) });
    }

    return fail(400, "Unknown view");
  } catch (err) {
    console.error("admin GET failed", err);
    return fail(500, "Something went wrong. Is sql/admin.sql run and SUPABASE_SERVICE_ROLE_KEY set?");
  }
}

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["block", "unblock", "deleteUser"]), userId: z.uuid() }),
  z.object({ action: z.literal("deleteConversation"), id: z.uuid() }),
  z.object({
    action: z.literal("saveSettings"),
    banner: z.object({ enabled: z.boolean(), text: z.string().trim().max(300) }),
    features: z.object({ "trip-assistant": z.boolean(), "trip-planner": z.boolean(), events: z.boolean() }),
  }),
]);

export async function POST(request: Request) {
  const me = await getAdminUser();
  if (!me) return fail(404, "Not found");
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Bad request");
  const body = parsed.data;

  try {
    const db = createAdminClient();

    if (body.action === "block" || body.action === "unblock" || body.action === "deleteUser") {
      // Never lock out or erase an admin (including yourself).
      const { data, error } = await db.auth.admin.getUserById(body.userId);
      if (error || !data.user) return fail(404, "User not found");
      if (data.user.id === me.id || isAdminEmail(data.user.email)) {
        return fail(403, "Admins cannot be blocked or deleted here.");
      }

      if (body.action === "deleteUser") {
        const res = await db.auth.admin.deleteUser(body.userId); // cascades to all their rows
        if (res.error) throw res.error;
      } else {
        const block = body.action === "block";
        const flag = await db.from("user_flags").upsert({
          user_id: body.userId,
          blocked: block,
          blocked_at: block ? new Date().toISOString() : null,
        });
        if (flag.error) throw flag.error;
        // Also stop new sign-ins (existing sessions are stopped by the flag above).
        const ban = await db.auth.admin.updateUserById(body.userId, {
          ban_duration: block ? "876000h" : "none",
        });
        if (ban.error) throw ban.error;
      }
    } else if (body.action === "deleteConversation") {
      const { error } = await db.from("assistant_conversations").delete().eq("id", body.id);
      if (error) throw error;
    } else if (body.action === "saveSettings") {
      const now = new Date().toISOString();
      const { error } = await db.from("site_settings").upsert([
        { key: "banner", value: body.banner, updated_at: now },
        { key: "features", value: body.features, updated_at: now },
      ]);
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin POST failed", err);
    return fail(500, "Something went wrong. Is sql/admin.sql run and SUPABASE_SERVICE_ROLE_KEY set?");
  }
}

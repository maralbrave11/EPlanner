// Server-only: who is an admin? The emails listed in ADMIN_EMAILS (comma separated,
// in .env.local and Vercel Environment Variables). The email must be confirmed.
import "server-only";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && adminEmails().includes(email.toLowerCase()));
}

export function isAdminUser(user: User | null | undefined): user is User {
  const email = user?.email?.toLowerCase();
  return Boolean(user && email && user.email_confirmed_at && adminEmails().includes(email));
}

/** The signed-in admin, or null when nobody is signed in or the user is not an admin. */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdminUser(user) ? user : null;
}

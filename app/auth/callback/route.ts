// GET /auth/callback?code=...&next=/reset-password
// The page the emailed links (password reset, email change) come back to. It trades the
// one-time code for a signed-in session on the server, then sends the user to `next`
// (for the password reset email that is /reset-password, where the new password is chosen).
// Runs as a Vercel serverless function.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  // Only same-site paths, so the link cannot be used to bounce people to another site.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("auth callback: could not exchange code", error.message);
    // On failure the target page shows its own "link invalid or expired" message.
  }

  return NextResponse.redirect(new URL(target, url.origin));
}

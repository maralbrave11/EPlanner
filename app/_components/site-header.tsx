"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** Top bar: app name + login state (log in / sign up, or email + log out). */
export function SiteHeader() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  // Without Supabase config there is no user to wait for.
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function logOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <Link href="/" className="font-semibold tracking-tight">
        SmartTrip
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        {!ready ? null : user ? (
          <>
            <span className="hidden text-zinc-500 sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={logOut}
              className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:underline">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

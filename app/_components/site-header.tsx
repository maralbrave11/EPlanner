"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z" />
        </svg>
      </span>
      SmartTrip
    </Link>
  );
}

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
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
      <Logo />
      <nav className="flex items-center gap-3 text-sm">
        {!ready ? null : user ? (
          <>
            <span className="hidden max-w-48 truncate text-muted sm:inline">{user.email}</span>
            <Link
              href="/trip-assistant"
              className="rounded-full px-3 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
            >
              Ask
            </Link>
            <button
              type="button"
              onClick={logOut}
              className="rounded-full border border-line px-3.5 py-1.5 font-medium hover:bg-surface"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="rounded-full px-3 py-1.5 font-medium hover:bg-surface">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-emerald-600 px-4 py-1.5 font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

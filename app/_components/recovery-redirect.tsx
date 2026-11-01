"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * Safety net for the password-reset email link: whatever page the link lands on
 * (for example the home page if the redirect URL is not allowed in Supabase),
 * send the user to /reset-password to choose a new password.
 */
export function RecoveryRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const goToReset = () => {
      if (window.location.pathname !== "/reset-password") router.replace("/reset-password");
    };
    // Old-style links carry the type in the URL hash.
    if (window.location.hash.includes("type=recovery")) goToReset();

    const { data } = createClient().auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") goToReset();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  return null;
}

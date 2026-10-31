"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(
        error.code === "over_email_send_rate_limit"
          ? t("auth.rateLimit")
          : error.message,
      );
      return;
    }

    if (!isLogin && !data.session) {
      setMessage(t("auth.checkEmail"));
      return;
    }

    // Return to the page that sent the user here (only same-site paths).
    const next = new URLSearchParams(window.location.search).get("next");
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    router.push(safeNext);
    router.refresh();
  }

  const inputClass =
    "rounded-xl border border-line bg-background px-3.5 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15";

  return (
    <div className="hero-glow flex flex-1 items-start justify-center px-4 py-14 sm:py-20">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isLogin ? t("auth.loginTitle") : t("auth.signupTitle")}
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          {isLogin
            ? t("auth.loginIntro")
            : t("auth.signupIntro")}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t("auth.email")}
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t("auth.password")}
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 font-medium text-white shadow-md shadow-emerald-600/20 transition hover:shadow-lg disabled:opacity-50"
          >
            {loading ? t("auth.wait") : isLogin ? t("auth.login") : t("auth.signup")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <Link
            href={isLogin ? "/signup" : "/login"}
            className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {isLogin ? t("auth.signup") : t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}

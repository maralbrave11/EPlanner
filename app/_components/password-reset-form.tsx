"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "rounded-xl border border-line bg-background px-3.5 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15";
const buttonClass =
  "rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 font-medium text-white shadow-md shadow-emerald-600/20 transition hover:shadow-lg disabled:opacity-50";

function Card({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="hero-glow flex flex-1 items-start justify-center px-4 py-14 sm:py-20">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {intro && <p className="mt-1 text-sm text-muted">{intro}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Alert({ tone, children }: { tone: "error" | "ok"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-3 py-2 text-sm ${
        tone === "error"
          ? "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
          : "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
      }`}
    >
      {children}
    </p>
  );
}

/** /forgot-password — asks for the email and sends a reset link. */
export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      // The link first passes /auth/callback, which signs the user in on the server and then
      // opens /reset-password, so the page always shows the new-password form.
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.code === "over_email_send_rate_limit" ? t("auth.rateLimit") : error.message);
      return;
    }
    // Same message whether or not the email has an account (does not reveal who is registered).
    setSent(true);
  }

  return (
    <Card title={t("auth.forgotTitle")} intro={t("auth.forgotIntro")}>
      {sent ? (
        <div className="flex flex-col gap-4">
          <Alert tone="ok">{t("auth.resetSent")}</Alert>
          <Link href="/login" className="text-center text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            {t("auth.backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
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
          {error && <Alert tone="error">{error}</Alert>}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? t("auth.wait") : t("auth.sendLink")}
          </button>
          <Link href="/login" className="text-center text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            {t("auth.backToLogin")}
          </Link>
        </form>
      )}
    </Card>
  );
}

/** /reset-password — the page the email link opens. Lets the user choose a new password. */
export function ResetPasswordForm() {
  const router = useRouter();
  const { t } = useI18n();
  // null = still checking the link, true = link opened a session, false = invalid/expired link
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // The link carries a one-time code; supabase-js trades it for a session when the page loads.
    // getSession() waits for that to finish.
    supabase.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("auth.mismatch"));
      return;
    }
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/trip-assistant");
      router.refresh();
    }, 1500);
  }

  if (hasSession === null) {
    return (
      <Card title={t("auth.resetTitle")}>
        <p role="status" className="text-sm text-muted">
          {t("auth.wait")}
        </p>
      </Card>
    );
  }

  if (!hasSession) {
    return (
      <Card title={t("auth.resetTitle")}>
        <div className="flex flex-col gap-4">
          <Alert tone="error">{t("auth.linkInvalid")}</Alert>
          <Link href="/forgot-password" className="text-center text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            {t("auth.sendLink")}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card title={t("auth.resetTitle")}>
      {done ? (
        <Alert tone="ok">{t("auth.resetDone")}</Alert>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t("auth.newPassword")}
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t("auth.confirmPassword")}
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </label>
          {error && <Alert tone="error">{error}</Alert>}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? t("auth.wait") : t("auth.saveNew")}
          </button>
        </form>
      )}
    </Card>
  );
}

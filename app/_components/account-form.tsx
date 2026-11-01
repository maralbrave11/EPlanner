"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "rounded-xl border border-line bg-background px-3.5 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15";

/** /account — shows the signed-in email and lets the user change it. */
export function AccountForm() {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    // The page is login-protected, so there is a user. (If the emailed link was just opened,
    // supabase-js finishes the change first and getUser() then returns the new email.)
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    const email = newEmail.trim();
    if (email.toLowerCase() === user?.email?.toLowerCase()) {
      setError(t("account.same"));
      return;
    }
    setLoading(true);
    const { error } = await createClient().auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/auth/callback?next=/account` },
    );
    setLoading(false);
    if (error) {
      setError(error.code === "over_email_send_rate_limit" ? t("auth.rateLimit") : error.message);
      return;
    }
    setSent(true);
    setNewEmail("");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwDone(false);
    if (password !== confirm) {
      setPwError(t("auth.mismatch"));
      return;
    }
    setPwLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
      return;
    }
    setPwDone(true);
    setPassword("");
    setConfirm("");
  }

  return (
    <div className="hero-glow flex flex-1 items-start justify-center px-4 py-14 sm:py-20">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{t("account.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("account.intro")}</p>

        <dl className="mt-6 text-sm">
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{t("account.current")}</dt>
          <dd className="mt-0.5 font-medium break-all">{user?.email ?? "…"}</dd>
        </dl>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t("account.newEmail")}
            <input
              type="email"
              required
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">
              {error}
            </p>
          )}
          {sent && (
            <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              {t("account.sent")}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !user}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 font-medium text-white shadow-md shadow-emerald-600/20 transition hover:shadow-lg disabled:opacity-50"
          >
            {loading ? t("auth.wait") : t("account.change")}
          </button>
        </form>

        <form onSubmit={changePassword} className="mt-8 flex flex-col gap-4 border-t border-line pt-6">
          <h2 className="text-lg font-semibold">{t("account.passwordTitle")}</h2>
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
          {pwError && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">
              {pwError}
            </p>
          )}
          {pwDone && (
            <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              {t("account.passwordDone")}
            </p>
          )}
          <button
            type="submit"
            disabled={pwLoading || !user}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 font-medium text-white shadow-md shadow-emerald-600/20 transition hover:shadow-lg disabled:opacity-50"
          >
            {pwLoading ? t("auth.wait") : t("auth.saveNew")}
          </button>
        </form>
      </div>
    </div>
  );
}

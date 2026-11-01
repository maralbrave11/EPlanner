"use client";

import { useEffect, useState } from "react";
import type { AssistantAnswer } from "@/features/trip-assistant/types";
import { DEFAULT_SETTINGS, type SiteSettings, type ToolId } from "@/lib/admin/settings";
import { useAdminT, type AdminKey } from "../messages";
import type {
  ActivityRow,
  ActivityView,
  AdminConversation,
  AdminUserRow,
  UserDetailView,
  UsersView,
} from "../types";

type Tab = "users" | "activity" | "site";

async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !data) throw new Error(data?.error ?? "Request failed");
  return data;
}

/** One line of text for an AI answer, for reading in the admin. */
function answerText(a: AssistantAnswer): string {
  if (a.kind === "detail") return `${a.title} — ${a.summary}`;
  if (a.kind === "route") return `${a.title} — ${a.steps.map((s) => s.name).join(" → ")}`;
  return `${a.summary}\n★ ${a.recommendation.title}\n${a.options.map((o) => `• ${o.title}`).join("\n")}`;
}

const KIND_KEY: Record<ActivityRow["kind"], AdminKey> = {
  assistant: "kindAssistant",
  "planner-suggest": "kindPlannerSuggest",
  "planner-plan": "kindPlannerPlan",
  events: "kindEvents",
};

const card = "rounded-2xl border border-line bg-surface p-4 shadow-sm";
const smallButton =
  "rounded-full border border-line px-3 py-1 text-sm font-medium transition hover:border-emerald-500 disabled:opacity-50";
const dangerButton =
  "rounded-full border border-rose-300 px-3 py-1 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950";

/** /admin — users, what they did, ratings, and site controls. Only for ADMIN_EMAILS. */
export function AdminPage() {
  const { t } = useAdminT();
  const [tab, setTab] = useState<Tab>("users");
  const [userId, setUserId] = useState<string | null>(null);

  const tabs: [Tab, AdminKey][] = [
    ["users", "tabUsers"],
    ["activity", "tabActivity"],
    ["site", "tabSite"],
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
        <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl shadow-md">
          🛡️
        </span>
        {t("title")}
      </h1>

      <nav className="flex max-w-md gap-1 rounded-xl bg-background p-1 ring-1 ring-line">
        {tabs.map(([id, key]) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? "page" : undefined}
            onClick={() => {
              setTab(id);
              setUserId(null);
            }}
            className={`flex-1 rounded-lg px-2 py-1.5 text-sm transition ${
              tab === id
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 font-medium text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t(key)}
          </button>
        ))}
      </nav>

      {tab === "users" &&
        (userId ? (
          <UserDetail userId={userId} onBack={() => setUserId(null)} />
        ) : (
          <UsersList onOpen={setUserId} />
        ))}
      {tab === "activity" && <ActivityList />}
      {tab === "site" && <SiteControls />}
    </div>
  );
}

function Status({ error, loading }: { error: boolean; loading: boolean }) {
  const { t } = useAdminT();
  if (error) return <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{t("loadError")}</p>;
  if (loading) return <p role="status" className="text-sm text-muted">{t("loading")}</p>;
  return null;
}

// ---------------------------------------------------------------------------

function UsersList({ onOpen }: { onOpen: (id: string) => void }) {
  const { t, date } = useAdminT();
  const [data, setData] = useState<UsersView | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<UsersView>("/api/admin?view=users")
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const users = (data?.users ?? []).filter((u) => u.email.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("search")}
          className="min-w-56 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          className={smallButton}
          onClick={() => {
            setData(null);
            setError(false);
            setReload((n) => n + 1);
          }}
        >
          {t("refresh")}
        </button>
      </div>
      <Status error={error} loading={!data && !error} />

      {data && (
        <>
          <div className={card}>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{t("avgRatings")}</h2>
            {data.ratings.length === 0 ? (
              <p className="text-sm text-muted">{t("noRatings")}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {data.ratings.map((r) => (
                  <li key={r.page} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900">
                    <span className="font-medium">{r.page}</span> {t("stars", { n: r.average })} ({r.count})
                  </li>
                ))}
              </ul>
            )}
          </div>

          {users.length === 0 ? (
            <p className="text-sm text-muted">{t("noUsers")}</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-sm">
              <table className="w-full min-w-192 text-start text-sm">
                <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
                  <tr>
                    {(["colUser", "colJoined", "colLast", "colChats", "colDeleted", "colActs", "colRating", "colStatus"] as const).map((k) => (
                      <th key={k} className="px-3 py-2 text-start font-semibold">{t(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <UserRow key={u.id} user={u} onOpen={() => onOpen(u.id)} date={date} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function UserRow({ user: u, onOpen, date }: { user: AdminUserRow; onOpen: () => void; date: (iso: string | null) => string }) {
  const { t } = useAdminT();
  const avg = u.ratings.length ? u.ratings.reduce((a, r) => a + r.rating, 0) / u.ratings.length : null;
  return (
    <tr onClick={onOpen} className="cursor-pointer border-b border-line last:border-0 hover:bg-background">
      <td className="px-3 py-2 font-medium">
        <button type="button" onClick={onOpen} className="text-start underline-offset-2 hover:underline">
          {u.email || u.id}
        </button>
        {u.isAdmin && (
          <span className="ms-2 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
            {t("adminBadge")}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-muted">{date(u.createdAt)}</td>
      <td className="px-3 py-2 text-muted">{u.lastSignInAt ? date(u.lastSignInAt) : t("never")}</td>
      <td className="px-3 py-2">{u.conversations}</td>
      <td className="px-3 py-2">
        {u.deletedConversations > 0 ? (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-200">
            {u.deletedConversations}
          </span>
        ) : (
          0
        )}
      </td>
      <td className="px-3 py-2">{u.activity}</td>
      <td className="px-3 py-2">{avg === null ? "—" : t("stars", { n: Math.round(avg * 10) / 10 })}</td>
      <td className="px-3 py-2">
        {u.blocked ? (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-200">{t("blocked")}</span>
        ) : (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-200">{t("active")}</span>
        )}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------

function UserDetail({ userId, onBack }: { userId: string; onBack: () => void }) {
  const { t, date } = useAdminT();
  const [data, setData] = useState<UserDetailView | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<UserDetailView>(`/api/admin?view=user&id=${userId}`)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [userId, reload]);

  async function act(body: unknown, after: "reload" | "back") {
    setBusy(true);
    setProblem(null);
    try {
      await api("/api/admin", body);
      if (after === "back") onBack();
      else setReload((n) => n + 1);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : t("actionError"));
    } finally {
      setBusy(false);
    }
  }

  const user = data?.user;

  return (
    <section className="flex flex-col gap-5">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
        {t("back")}
      </button>
      <Status error={error} loading={!data && !error} />

      {data && user && (
        <>
          <div className={`${card} flex flex-wrap items-center gap-3`}>
            <div className="min-w-48 flex-1">
              <p className="text-lg font-semibold">{user.email}</p>
              <p className="text-sm text-muted">
                {t("colJoined")}: {date(user.createdAt)} · {t("colLast")}: {user.lastSignInAt ? date(user.lastSignInAt) : t("never")}
              </p>
            </div>
            {user.blocked && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-200">{t("blocked")}</span>}
            {!user.isAdmin && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className={user.blocked ? smallButton : dangerButton}
                  onClick={() => {
                    if (user.blocked || window.confirm(t("confirmBlock", { email: user.email }))) {
                      void act({ action: user.blocked ? "unblock" : "block", userId }, "reload");
                    }
                  }}
                >
                  {user.blocked ? t("unblock") : t("block")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={dangerButton}
                  onClick={() => {
                    if (window.confirm(t("confirmDeleteUser", { email: user.email }))) {
                      void act({ action: "deleteUser", userId }, "back");
                    }
                  }}
                >
                  {t("deleteUser")}
                </button>
              </div>
            )}
          </div>
          {problem && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{problem}</p>}

          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{t("sectionRatings")}</h2>
            {user.ratings.length === 0 ? (
              <p className="text-sm text-muted">{t("noRatings")}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {user.ratings.map((r) => (
                  <li key={r.page} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900">
                    {r.page} {t("stars", { n: r.rating })}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{t("sectionChats")}</h2>
            {data.conversations.length === 0 ? (
              <p className="text-sm text-muted">{t("noChats")}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.conversations.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    busy={busy}
                    onDelete={() => {
                      if (window.confirm(t("confirmDeleteChat"))) void act({ action: "deleteConversation", id: c.id }, "reload");
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{t("sectionActivity")}</h2>
            <ActivityTable rows={data.activity} showUser={false} />
          </div>
        </>
      )}
    </section>
  );
}

function ConversationItem({ conversation: c, busy, onDelete }: { conversation: AdminConversation; busy: boolean; onDelete: () => void }) {
  const { t, date } = useAdminT();
  return (
    <details className={`${card} ${c.deletedAt ? "border-rose-300 dark:border-rose-900" : ""}`}>
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm font-medium">
        <span className="min-w-48 flex-1">{c.title}</span>
        <span className="text-xs font-normal text-muted">{date(c.createdAt)}</span>
        {c.deletedAt && (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-200">
            {t("deletedByUser", { date: date(c.deletedAt) })}
          </span>
        )}
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        {c.messages.map((m) => (
          <div key={m.id} className={`rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-blue-50 dark:bg-blue-950" : "bg-background ring-1 ring-line"}`}>
            <p className="mb-0.5 text-xs font-semibold tracking-wide text-muted uppercase">
              {m.role === "user" ? t("userSays") : t("aiSays")} · {date(m.createdAt)}
            </p>
            <p className="break-words whitespace-pre-line">{m.role === "user" ? m.content : m.answer ? answerText(m.answer) : ""}</p>
          </div>
        ))}
        <button type="button" disabled={busy} onClick={onDelete} className={`${dangerButton} self-start`}>
          {t("deleteChat")}
        </button>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------

function ActivityTable({ rows, showUser }: { rows: ActivityRow[]; showUser: boolean }) {
  const { t, date } = useAdminT();
  if (rows.length === 0) return <p className="text-sm text-muted">{t("noActivity")}</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-sm">
      <table className="w-full min-w-160 text-start text-sm">
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-line last:border-0 align-top">
              <td className="px-3 py-2 whitespace-nowrap text-muted">{date(a.createdAt)}</td>
              {showUser && <td className="px-3 py-2 font-medium">{a.email}</td>}
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-200">{t(KIND_KEY[a.kind])}</span>
              </td>
              <td className="px-3 py-2 break-words">{a.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityList() {
  const { t } = useAdminT();
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<ActivityView>("/api/admin?view=activity")
      .then((d) => !cancelled && setRows(d.activity))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">{t("sectionActivity")}</h2>
      <Status error={error} loading={!rows && !error} />
      {rows && <ActivityTable rows={rows} showUser />}
    </section>
  );
}

// ---------------------------------------------------------------------------

function SiteControls() {
  const { t } = useAdminT();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ settings: SiteSettings }>("/api/admin?view=settings")
      .then((d) => !cancelled && setSettings(d.settings))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      await api("/api/admin", { action: "saveSettings", banner: settings.banner, features: settings.features });
      setMessage(t("saved"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("actionError"));
    } finally {
      setSaving(false);
    }
  }

  const tools: [ToolId, AdminKey][] = [
    ["trip-assistant", "toolChat"],
    ["trip-planner", "toolPlanner"],
    ["events", "toolEvents"],
  ];
  const s = settings ?? DEFAULT_SETTINGS;

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <Status error={error} loading={!settings && !error} />
      {settings && (
        <>
          <div className={`${card} flex flex-col gap-3`}>
            <h2 className="font-semibold">{t("siteBannerTitle")}</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.banner.enabled}
                onChange={(e) => setSettings({ ...s, banner: { ...s.banner, enabled: e.target.checked } })}
                className="h-4 w-4 accent-blue-600"
              />
              {t("bannerOn")}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{t("bannerText")}</span>
              <textarea
                rows={2}
                maxLength={300}
                value={s.banner.text}
                onChange={(e) => setSettings({ ...s, banner: { ...s.banner, text: e.target.value } })}
                className="rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-muted">{t("bannerHint")}</span>
            </label>
          </div>

          <div className={`${card} flex flex-col gap-3`}>
            <h2 className="font-semibold">{t("toolsTitle")}</h2>
            <p className="text-xs text-muted">{t("toolsHint")}</p>
            {tools.map(([id, key]) => (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={s.features[id]}
                  onChange={(e) => setSettings({ ...s, features: { ...s.features, [id]: e.target.checked } })}
                  className="h-4 w-4 accent-blue-600"
                />
                {t(key)}
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
            >
              {t("save")}
            </button>
            {message && <span role="status" className="text-sm text-muted">{message}</span>}
          </div>
        </>
      )}
    </section>
  );
}

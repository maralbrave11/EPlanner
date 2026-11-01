// Browser helper for the stateless AI routes (/api/events, /api/trip-planner).

/** An API failure. `code` maps to a translated `err.<code>` message. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Network error. Check your connection and try again.", "network");
  }
  const data = (await res.json().catch(() => null)) as
    | { answer?: T; error?: string; code?: string }
    | null;
  if (!res.ok || !data?.answer) {
    throw new ApiError(
      data?.error ?? "The assistant could not answer right now. Please try again.",
      data?.code ?? "claude",
    );
  }
  return data.answer;
}

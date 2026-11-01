// Server-only, development only: prints the exact prompt sent to Claude and the reply,
// for every AI call, in the terminal running `npm run dev` and in `llm-debug.log`
// (git-ignored, project root). Does nothing in production, so nothing is logged on Vercel.
import "server-only";

import { appendFileSync } from "node:fs";

type Info = {
  /** Which feature made the call, e.g. "assistant:ask", "events", "planner:plan". */
  label: string;
  model: string;
  system: string;
  messages: unknown;
};

type Response = {
  parsed_output?: unknown;
  stop_reason?: string | null;
  usage?: unknown;
};

const LINE = "=".repeat(78);

function write(text: string) {
  console.log(text);
  try {
    appendFileSync("llm-debug.log", text + "\n");
  } catch {
    // Read-only disk: the terminal output is enough.
  }
}

function block(title: string, body: string) {
  return `--- ${title} ---\n${body}`;
}

/** Runs the Claude call `run` and logs prompt + reply (or the error) in development. */
export async function traceLlm<T extends Response>(info: Info, run: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === "production") return run();

  const started = performance.now();
  const head = `${LINE}\nLLM CALL  ${info.label}  (${info.model})  ${new Date().toISOString()}\n${LINE}`;
  const prompt = [
    block("SYSTEM PROMPT", info.system),
    block("MESSAGES", JSON.stringify(info.messages, null, 2)),
  ].join("\n\n");

  try {
    const response = await run();
    const ms = Math.round(performance.now() - started);
    write(
      [
        head,
        prompt,
        block(
          `REPLY (${ms} ms, stop_reason: ${response.stop_reason ?? "?"})`,
          JSON.stringify(response.parsed_output ?? null, null, 2),
        ),
        block("USAGE (tokens)", JSON.stringify(response.usage ?? null)),
        "",
      ].join("\n\n"),
    );
    return response;
  } catch (err) {
    const ms = Math.round(performance.now() - started);
    write([head, prompt, block(`ERROR (${ms} ms)`, String(err)), ""].join("\n\n"));
    throw err;
  }
}

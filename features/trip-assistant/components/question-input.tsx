"use client";

import { useState } from "react";

type QuestionInputProps = {
  onSubmit: (question: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
};

/** Text box + send button. Enter sends, Shift+Enter adds a new line. */
export function QuestionInput({ onSubmit, disabled, placeholder, ref }: QuestionInputProps) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !disabled;

  function submit() {
    if (!canSend) return;
    onSubmit(value.trim());
    setValue("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-xl border border-zinc-300 bg-white p-2 focus-within:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <textarea
        ref={ref}
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder ?? "Ask a travel question…"}
        aria-label="Your travel question"
        className="flex-1 resize-none bg-transparent px-2 py-1 outline-none"
      />
      <button
        type="submit"
        disabled={!canSend}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
      >
        Ask
      </button>
    </form>
  );
}

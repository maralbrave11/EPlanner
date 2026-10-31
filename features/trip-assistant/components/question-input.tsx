"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-provider";

type QuestionInputProps = {
  onSubmit: (question: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
};

/** Text box + send button. Enter sends, Shift+Enter adds a new line. */
export function QuestionInput({ onSubmit, disabled, placeholder, ref }: QuestionInputProps) {
  const { t } = useI18n();
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
      className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-lg shadow-black/5 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/15"
    >
      <textarea
        ref={ref}
        rows={2}
        maxLength={2000}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Do not send while an IME (Chinese, Japanese, ...) is still composing text.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder ?? t("input.placeholder")}
        aria-label={t("input.aria")}
        className="flex-1 resize-none bg-transparent px-2.5 py-1.5 outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label={t("input.sendAria")}
        className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 font-medium text-white shadow-sm transition hover:shadow-md disabled:opacity-40 disabled:shadow-none"
      >
        {t("input.send")}
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 rtl:-scale-x-100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}

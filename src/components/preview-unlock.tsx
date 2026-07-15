"use client";

import { useState, useTransition } from "react";
import { submitPreviewPassword } from "@/app/actions/preview-access";

const CREAM = "#F5F1E6";

export function PreviewUnlock() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || pending) return;
    setError(false);
    startTransition(async () => {
      const res = await submitPreviewPassword(password);
      if (res.ok) {
        // Reload so the server re-renders the now-unlocked store.
        window.location.reload();
      } else {
        setError(true);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs uppercase tracking-[0.24em] underline-offset-4 hover:underline"
        style={{ color: "color-mix(in srgb, " + CREAM + " 55%, transparent)" }}
      >
        Have a preview password?
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex w-full max-w-xs flex-col items-center gap-3">
      <label htmlFor="preview-password" className="sr-only">
        Preview password
      </label>
      <input
        id="preview-password"
        type="password"
        autoFocus
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(false);
        }}
        placeholder="Preview password"
        aria-invalid={error}
        className="w-full rounded-md border px-3 py-2 text-center text-sm outline-none"
        style={{
          background: "color-mix(in srgb, " + CREAM + " 8%, transparent)",
          borderColor: error
            ? "#e2708a"
            : "color-mix(in srgb, " + CREAM + " 30%, transparent)",
          color: CREAM,
        }}
      />
      <button
        type="submit"
        disabled={pending || !password.trim()}
        className="w-full rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-opacity disabled:opacity-50"
        style={{ background: "var(--color-accent)", color: "#0a1124" }}
      >
        {pending ? "Unlocking…" : "Enter store"}
      </button>
      {error ? (
        <p className="text-xs" style={{ color: "#e2708a" }}>
          Incorrect password. Please try again.
        </p>
      ) : null}
    </form>
  );
}

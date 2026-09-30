"use client";

import { useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

/**
 * 48px touch-target quantity stepper — the POS-primary control size. The
 * number is also a typeable field: the draft commits on Enter/blur (clamped to
 * min/max, 0 removes the line like "−" does) and Escape reverts.
 */
export function QtyStepper({
  quantity,
  onChange,
  disabled,
  min = 1,
  max = null,
  size = "md",
}: {
  quantity: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number | null;
  size?: "sm" | "md";
}) {
  // null = not editing, so the field always mirrors the cart until focused.
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);

  const btn =
    size === "md"
      ? "h-12 w-12 text-base"
      : "h-9 w-9 text-sm";
  const cls = `inline-flex items-center justify-center rounded-md border border-input bg-white transition-colors hover:bg-muted disabled:opacity-40 ${btn}`;

  const commit = (raw: string) => {
    setDraft(null);
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const typed = Number.parseInt(raw, 10);
    if (Number.isNaN(typed)) return;
    const next = typed <= 0 ? 0 : Math.min(Math.max(typed, min), max ?? Infinity);
    if (next !== quantity) onChange(next);
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        className={cls}
        disabled={disabled || quantity <= 0}
        onClick={() => onChange(quantity <= min ? 0 : Math.max(min, Math.min(quantity - 1, max ?? Infinity)))}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </button>
      {/*
        readOnly rather than disabled while the cart is busy: disabling a
        focused input drops focus mid-edit and would commit a half-typed number.
        text-base minimum keeps iOS from zooming the page on focus.
      */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        enterKeyHint="done"
        autoComplete="off"
        aria-label="Quantity"
        readOnly={disabled}
        value={draft ?? String(quantity)}
        onFocus={(e) => {
          setDraft(String(quantity));
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 5))}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            cancelled.current = true;
            e.currentTarget.blur();
          }
        }}
        className={`rounded-md border border-transparent bg-transparent text-center font-medium tabular-nums outline-none transition-colors hover:border-input focus:border-ring focus:bg-white focus:ring-2 focus:ring-ring/30 ${
          size === "md" ? "h-12 w-14 text-lg sm:w-16" : "h-9 w-12 text-base"
        }`}
      />
      <button
        type="button"
        className={cls}
        disabled={disabled || (max !== null && quantity >= max)}
        onClick={() => onChange(quantity + 1)}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

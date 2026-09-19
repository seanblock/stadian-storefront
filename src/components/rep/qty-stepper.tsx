"use client";

import { Minus, Plus } from "lucide-react";

/** 48px touch-target quantity stepper — the POS-primary control size. */
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
  const btn =
    size === "md"
      ? "h-12 w-12 text-base"
      : "h-9 w-9 text-sm";
  const cls = `inline-flex items-center justify-center rounded-md border border-input bg-white transition-colors hover:bg-muted disabled:opacity-40 ${btn}`;

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
      <span
        className={`inline-flex items-center justify-center font-medium tabular-nums ${size === "md" ? "min-w-8 text-lg sm:min-w-12" : "min-w-9 text-sm"}`}
        aria-live="polite"
      >
        {quantity}
      </span>
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

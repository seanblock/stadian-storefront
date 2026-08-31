"use client";

import { CreditCard, FileText, Link2 } from "lucide-react";
import type { PaymentModeAvailability } from "@/app/rep/new-sale/sale-logic";

export type PaymentMode = "card" | "link" | "invoice";

const MODES: Array<{
  mode: PaymentMode;
  title: string;
  description: string;
  icon: typeof CreditCard;
}> = [
  {
    mode: "card",
    title: "Charge card",
    description: "Enter the customer's card now — charged immediately.",
    icon: CreditCard,
  },
  {
    mode: "link",
    title: "Send payment link",
    description: "Email a secure pay link (and show a QR) — they pay themselves.",
    icon: Link2,
  },
  {
    mode: "invoice",
    title: "Invoice — pay later",
    description: "Place the order unpaid; settled offline (terms, wire, etc.).",
    icon: FileText,
  },
];

export function PaymentModeCards({
  value,
  onChange,
  disabled,
  availability,
}: {
  value: PaymentMode | null;
  onChange: (mode: PaymentMode) => void;
  disabled?: boolean;
  /** Per-mode usability — see paymentModeAvailability(). */
  availability: Record<PaymentMode, PaymentModeAvailability>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
      {MODES.map(({ mode, title, description, icon: Icon }) => {
        const active = value === mode;
        const { available, reason } = availability[mode];
        const unavailable = !available;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled || unavailable}
            onClick={() => onChange(mode)}
            className={`flex min-h-24 flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? "border-[#0a1a2e] bg-[#0a1a2e] text-white"
                : "border-border bg-white hover:border-[#0a1a2e]/40"
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon
                className="size-5"
                style={{ color: active ? "#d4a951" : "#0a1a2e" }}
              />
              <span className="font-medium">{title}</span>
            </span>
            <span
              className={`text-xs leading-snug ${active ? "text-white/70" : "text-muted-foreground"}`}
            >
              {reason ?? description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

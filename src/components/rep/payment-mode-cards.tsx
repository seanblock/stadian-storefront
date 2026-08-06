"use client";

import { CreditCard, FileText, Link2 } from "lucide-react";

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
  linkAvailable = true,
}: {
  value: PaymentMode | null;
  onChange: (mode: PaymentMode) => void;
  disabled?: boolean;
  /** Gateways without pay-by-link support gray the link option out. */
  linkAvailable?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
      {MODES.map(({ mode, title, description, icon: Icon }) => {
        const active = value === mode;
        const unavailable = mode === "link" && !linkAvailable;
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
              {unavailable ? "Not available on this store's gateway." : description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

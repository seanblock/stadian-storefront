"use client";

import { useCart } from "@/providers/cart-provider";

const GOLD = "#d4a951";

export function CartIcon() {
  const { cart, setDrawerOpen } = useCart();
  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const hasItems = itemCount > 0;
  const label = String(itemCount).padStart(2, "0");

  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className="group relative inline-flex items-center gap-2 px-2 py-1.5"
      aria-label="Open cart"
    >
      {/* Custom thin-line bag — more architectural than lucide's filled cart */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-[18px] transition-transform duration-300 group-hover:-translate-y-0.5"
        aria-hidden
      >
        <path
          d="M5 7h14l-1.2 12.2A2 2 0 0115.8 21H8.2a2 2 0 01-2-1.8L5 7z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 7V5a3 3 0 016 0v2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Mono numeric badge — looks like a price tag */}
      <span
        className={`min-w-[1.4rem] font-mono text-[10px] font-bold tabular-nums tracking-[0.18em] transition-opacity duration-300 ${
          hasItems ? "opacity-100" : "opacity-45"
        }`}
        style={hasItems ? { color: GOLD } : undefined}
      >
        {label}
      </span>
      {/* Pulsing gold dot when items present */}
      {hasItems && (
        <span aria-hidden className="absolute -right-1 -top-1 flex size-2">
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-60"
            style={{ background: GOLD }}
          />
          <span
            className="relative size-2 rounded-full"
            style={{ background: GOLD }}
          />
        </span>
      )}
    </button>
  );
}

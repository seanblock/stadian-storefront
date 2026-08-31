"use client";

import type { RepCustomer } from "@stadian/storefront-sdk";
import { fmtCurrency } from "@/components/rep/format";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";

const NAVY = "#0a1a2e";

function fmtDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Column widths shared by the header and every row, so they line up. */
const GRID =
  "grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] items-center gap-4";

export function CustomerRowHeader() {
  return (
    <div
      className={`${GRID} border-b border-border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground`}
    >
      <span>Customer</span>
      <span>Account</span>
      <span>You sold</span>
      <span className="w-24 text-right">Last order</span>
      <span className="w-32" />
    </div>
  );
}

/**
 * One customer per line. A rep scanning for a name reads a single column of
 * left-aligned names — far faster than tracking across a card grid — while the
 * columns to the right answer "have I sold to them, and when" without a click.
 */
export function CustomerRow({
  customer,
  onStartSale,
}: {
  customer: RepCustomer;
  onStartSale: (customer: RepCustomer) => void;
}) {
  const orders = customer.order_count ?? 0;
  const spent = customer.total_spent ?? 0;
  const lastOrder = fmtDate(customer.last_order_at);
  const isBusiness = customer.customer_type === "business";
  const name = customer.name || customer.email;

  return (
    <div className="border-b border-border last:border-b-0">
      {/* ── Desktop: aligned columns ─────────────────────────────────── */}
      <div className={`hidden ${GRID} px-4 py-3 transition-colors hover:bg-muted/40 md:grid`}>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
            style={{ background: NAVY }}
            aria-hidden
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-[#0a1a2e]">{name}</p>
            <p className="truncate text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>

        <div className="min-w-0 text-sm">
          <p className="truncate text-[#0a1a2e]">
            {isBusiness ? (customer.company_name || "Business") : "Individual"}
          </p>
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="truncate text-muted-foreground hover:underline"
            >
              {customer.phone}
            </a>
          )}
        </div>

        <div className="min-w-0 text-sm">
          <p className="tabular-nums text-[#0a1a2e]">{fmtCurrency(spent)}</p>
          <p className="text-muted-foreground">
            {orders} {orders === 1 ? "order" : "orders"}
          </p>
        </div>

        <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">
          {lastOrder ?? "—"}
        </span>

        <div className="flex w-32 items-center justify-end gap-2">
          {!customer.is_mine && <Badge variant="outline">Unclaimed</Badge>}
          <button
            type="button"
            onClick={() => onStartSale(customer)}
            aria-label={`Start a sale for ${name}`}
            className="flex size-11 items-center justify-center rounded-md text-white transition-opacity hover:opacity-90"
            style={{ background: NAVY }}
          >
            <ShoppingBag className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* ── Phone: one tappable row, stats on a second line ──────────── */}
      <button
        type="button"
        onClick={() => onStartSale(customer)}
        aria-label={`Start a sale for ${name}`}
        className="flex w-full min-h-16 items-center gap-3 px-3 py-3 text-left transition-colors active:bg-muted md:hidden"
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
          style={{ background: NAVY }}
          aria-hidden
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-[#0a1a2e]">{name}</span>
            {!customer.is_mine && <Badge variant="outline">Unclaimed</Badge>}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {customer.email}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {orders === 0
              ? "No orders from you yet"
              : `${orders} ${orders === 1 ? "order" : "orders"} · ${fmtCurrency(spent)}${
                  lastOrder ? ` · last ${lastOrder}` : ""
                }`}
          </span>
        </span>
        <ShoppingBag className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </div>
  );
}

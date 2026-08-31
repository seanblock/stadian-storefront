"use client";

import Link from "next/link";
import type { RepOrderSummary } from "@stadian/storefront-sdk";
import { fmtCurrency, fmtDate } from "@/components/rep/format";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Link2 } from "lucide-react";

/** Status → the one thing a rep needs to know about it. */
const STATUS_TONE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  paid: "bg-emerald-100 text-emerald-900",
  processing: "bg-blue-100 text-blue-900",
  shipped: "bg-blue-100 text-blue-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-muted text-muted-foreground",
};

const PAYMENT_LABEL: Record<string, string> = {
  invoice: "Invoice",
  card: "Card",
  ach: "ACH",
};

/** Column widths shared by the header and every row, so they line up. */
const GRID =
  "grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-4";

export function OrderRowHeader() {
  return (
    <div
      className={`${GRID} border-b border-border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground`}
    >
      <span>Order</span>
      <span>Customer</span>
      <span>Items</span>
      <span>Payment</span>
      <span className="w-24 text-right">Total</span>
      <span className="w-5" />
    </div>
  );
}

function itemSummary(order: RepOrderSummary): string {
  const items = order.items ?? [];
  if (items.length === 0) return "—";
  const units = items.reduce((sum, i) => sum + i.quantity, 0);
  const first = items[0].product_name ?? "item";
  return items.length === 1
    ? `${units} × ${first}`
    : `${units} units · ${items.length} lines`;
}

export function OrderRow({ order }: { order: RepOrderSummary }) {
  const status = order.status.replace(/_/g, " ");
  const tone = STATUS_TONE[order.status] ?? "bg-muted text-muted-foreground";
  const customer = order.customer_name || order.customer_email || "Unknown customer";
  const awaitingLink =
    order.payment_link_url && order.status === "pending_payment";

  return (
    <Link
      href={`/rep/orders/${order.id}`}
      className="block border-b border-border transition-colors last:border-b-0 hover:bg-muted/40"
    >
      {/* ── Desktop: aligned columns ─────────────────────────────────── */}
      <div className={`hidden ${GRID} px-4 py-3 md:grid`}>
        <div className="min-w-0">
          <p className="font-medium tabular-nums text-[#0a1a2e]">
            {order.order_number ? `#${order.order_number}` : "—"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {fmtDate(order.created_at)}
          </p>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm text-[#0a1a2e]">{customer}</p>
          <Badge className={`${tone} mt-0.5`}>{status}</Badge>
        </div>

        <p className="truncate text-sm text-muted-foreground">
          {itemSummary(order)}
        </p>

        <p className="flex min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground">
          {awaitingLink && <Link2 className="size-3.5 shrink-0" aria-hidden />}
          {order.payment_method
            ? (PAYMENT_LABEL[order.payment_method] ?? order.payment_method)
            : awaitingLink
              ? "Link sent"
              : "—"}
        </p>

        <span className="w-24 text-right font-medium tabular-nums text-[#0a1a2e]">
          {fmtCurrency(order.total)}
        </span>

        <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
      </div>

      {/* ── Phone: stacked ───────────────────────────────────────────── */}
      <div className="flex min-h-16 items-center gap-3 px-3 py-3 md:hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-[#0a1a2e]">{customer}</span>
            <Badge className={tone}>{status}</Badge>
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {order.order_number ? `#${order.order_number} · ` : ""}
            {fmtDate(order.created_at)} · {itemSummary(order)}
          </span>
        </div>
        <span className="shrink-0 font-medium tabular-nums text-[#0a1a2e]">
          {fmtCurrency(order.total)}
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </div>
    </Link>
  );
}

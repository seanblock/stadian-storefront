"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RepOrderSummary } from "@stadian/storefront-sdk";
import { getRepOrders } from "@/app/actions/rep";
import { fmtCurrency, fmtDate } from "@/components/rep/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 25;

const FILTERS: Array<{ label: string; status?: string }> = [
  { label: "All" },
  { label: "Awaiting payment", status: "pending_payment" },
  { label: "Paid", status: "paid" },
  { label: "Shipped", status: "shipped" },
];

export default function RepOrdersPage() {
  const [orders, setOrders] = useState<RepOrderSummary[] | null>(null);
  const [status, setStatus] = useState<string | undefined>();
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // `loading` is flipped on by the click handlers; this effect only fetches.
    let cancelled = false;
    getRepOrders({ status, limit: PAGE_SIZE, offset }).then((r) => {
      if (cancelled) return;
      if (r.ok) {
        setOrders((prev) =>
          offset === 0 ? r.data.items : [...(prev ?? []), ...r.data.items]
        );
        setHasMore(r.data.has_more);
      } else if (offset === 0) {
        setOrders([]);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [status, offset]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6">
      <h1 className="font-serif text-3xl text-[#0a1a2e]">My sales</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => {
              setLoading(true);
              setStatus(f.status);
              setOffset(0);
            }}
            className={`h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
              status === f.status
                ? "border-[#0a1a2e] bg-[#0a1a2e] text-white"
                : "border-border bg-white hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        {orders === null || (loading && offset === 0) ? (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : orders.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No orders here yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/rep/orders/${order.id}`}
                  className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-[#0a1a2e]">
                      {order.customer_name || order.customer_email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {order.order_number ? `#${order.order_number} · ` : ""}
                      {fmtDate(order.created_at)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <Badge variant={order.status === "pending_payment" ? "secondary" : "outline"}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="font-medium tabular-nums">{fmtCurrency(order.total)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasMore && (
        <Button
          variant="outline"
          className="h-12 bg-white"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setOffset(offset + PAGE_SIZE);
          }}
        >
          {loading ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}

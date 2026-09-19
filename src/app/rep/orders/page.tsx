"use client";

import { useEffect, useState } from "react";
import type { RepOrderSummary } from "@stadian/storefront-sdk";
import { getRepOrders } from "@/app/actions/rep";
import { fmtCurrency } from "@/components/rep/format";
import { OrderRow, OrderRowHeader } from "@/components/rep/order-row";
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
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // `loading` is flipped on by the click handlers; this effect only fetches.
    let cancelled = false;
    getRepOrders({ status, limit: PAGE_SIZE, offset }).then((r) => {
      if (cancelled) return;
      if (r.ok) {
        setError(null);
        setOrders((prev) =>
          offset === 0 ? r.data.items : [...(prev ?? []), ...r.data.items]
        );
        setHasMore(r.data.has_more);
      } else {
        setError(r.message);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [status, offset, attempt]);

  const shown = orders ?? [];
  const shownValue = shown.reduce((sum, o) => sum + o.total, 0);
  const awaiting = shown.filter((o) => o.status === "pending_payment");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-serif text-3xl text-[#0a1a2e]">My sales</h1>
        <p className="text-sm text-muted-foreground">
          {error ? "Sales could not be refreshed." : orders === null
            ? "Loading your sales…"
            : shown.length === 0
              ? "Orders you place appear here."
              : `${shown.length} ${shown.length === 1 ? "order" : "orders"} shown · ${fmtCurrency(shownValue)} in this list${
                  awaiting.length > 0
                    ? ` · ${awaiting.length} awaiting payment (${fmtCurrency(
                        awaiting.reduce((sum, o) => sum + o.total, 0)
                      )})`
                    : ""
                }`}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => {
              setLoading(true);
              setAttempt((n) => n + 1);
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
        {error ? (
          <div role="alert" className="p-4">
            <p>{error}</p>
            <Button className="mt-3" variant="outline" disabled={loading} onClick={() => { setLoading(true); setAttempt((n) => n + 1); }}>Retry orders</Button>
          </div>
        ) : orders === null || (loading && offset === 0) ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            {status
              ? "No orders with that status."
              : "No orders yet — your sales will show up here."}
          </p>
        ) : (
          <>
            <div className="hidden md:block">
              <OrderRowHeader />
            </div>
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </>
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  RepDashboard,
  StorefrontCommission,
  StorefrontPayout,
} from "@stadian/storefront-sdk";
import { getRepCommissions, getRepPayouts, getRepDashboard } from "@/app/actions/rep";
import { Button } from "@/components/ui/button";
import { fmtCurrency, fmtDate } from "@/components/rep/format";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

const NAVY = "#0a1a2e";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-blue-100 text-blue-900",
  paid: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-900",
  confirmed: "bg-emerald-100 text-emerald-900",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_STYLE[status] ?? "bg-muted text-muted-foreground"}>
      {status}
    </Badge>
  );
}

/** One number with its meaning spelled out, not just a label. */
function Figure({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-4 ${
        accent ? "border-transparent bg-[#0a1a2e] text-white" : "border-border bg-white"
      }`}
    >
      <span
        className={`text-[11px] font-medium uppercase tracking-[0.16em] ${
          accent ? "text-white/60" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <span
        className="font-serif text-3xl tabular-nums"
        style={accent ? undefined : { color: NAVY }}
      >
        {value}
      </span>
      {note && (
        <span className={`text-xs ${accent ? "text-white/70" : "text-muted-foreground"}`}>
          {note}
        </span>
      )}
    </div>
  );
}

export default function RepCommissionsPage() {
  const [dashboard, setDashboard] = useState<RepDashboard | null>(null);
  const [commissions, setCommissions] = useState<StorefrontCommission[] | null>(null);
  const [payouts, setPayouts] = useState<StorefrontPayout[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getRepDashboard(), getRepCommissions(), getRepPayouts()]).then(([d, c, p]) => {
      if (cancelled) return;
      if (!d.ok || !c.ok || !p.ok) {
        setError(!d.ok ? d.message : !c.ok ? c.message : !p.ok ? p.message : "Unable to load earnings.");
        return;
      }
      setError(null);
      setDashboard(d.data);
      setCommissions(c.data.items);
      setPayouts(p.data.items);
    }).catch(() => {
      if (!cancelled) setError("Unable to load earnings. Please try again shortly.");
    });
    return () => { cancelled = true; };
  }, [attempt]);

  if (error) {
    return <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="font-serif text-3xl text-[#0a1a2e]">Commissions</h1>
      <div role="alert" className="mt-4 rounded-lg border p-4">
        <p>{error}</p>
        <Button variant="outline" className="mt-3" onClick={() => { setError(null); setDashboard(null); setCommissions(null); setPayouts(null); setAttempt((n) => n + 1); }}>Retry earnings</Button>
      </div>
    </div>;
  }

  const c = dashboard?.commissions;
  const unrealized = c?.unrealized ?? 0;
  const unrealizedOrders = c?.unrealized_order_count ?? 0;
  const rate =
    dashboard?.commission_rate != null
      ? `${Number((dashboard.commission_rate * 100).toFixed(2))}%`
      : "—";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-serif text-3xl text-[#0a1a2e]">Commissions</h1>
        <p className="text-sm text-muted-foreground">
          {!dashboard ? "Loading earnings…" : dashboard.commission_active === false
            ? "New commission earnings are paused. You can still use the sales portal, and your previous earnings remain visible. Contact your store administrator to resume commissions."
            : `Your commission rate is ${rate} of eligible product value. Commission is created when an eligible order is paid.`}
        </p>
      </div>

      {dashboard ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Figure
            label="Awaiting payment"
            value={fmtCurrency(unrealized)}
            note={
              dashboard.commission_active === false
                ? "new commission earnings paused"
                : unrealizedOrders > 0
                ? `from ${unrealizedOrders} unpaid ${
                    unrealizedOrders === 1 ? "order" : "orders"
                  }`
                : "no unpaid commission-eligible orders"
            }
          />
          <Figure
            label="Pending"
            value={fmtCurrency(c?.pending ?? 0)}
            note="earned, awaiting approval"
          />
          <Figure
            label="Approved"
            value={fmtCurrency(c?.approved ?? 0)}
            note="cleared for payout"
          />
          <Figure
            label="Paid out"
            value={fmtCurrency(c?.paid ?? 0)}
            note="already in your pocket"
            accent
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {/* The zero state that used to be four silent zeros. */}
      {dashboard &&
        unrealized > 0 &&
        (c?.pending ?? 0) === 0 &&
        (c?.approved ?? 0) === 0 &&
        (c?.paid ?? 0) === 0 && (
          <Link
            href="/rep/orders"
            className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition-colors hover:bg-amber-100"
          >
            <span>
              Nothing has been paid out yet because your{" "}
              {unrealizedOrders === 1 ? "order is" : "orders are"} still awaiting
              payment. Settle {unrealizedOrders === 1 ? "it" : "them"} and{" "}
              {fmtCurrency(unrealized)} becomes commission.
            </span>
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          </Link>
        )}

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-xl text-[#0a1a2e]">Commission history</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          {commissions === null ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : commissions.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              {dashboard?.commission_rate === 0
                ? "Your current commission rate is 0%, so paid sales do not earn a commission. Contact your store administrator if this rate is unexpected."
                : "No commission yet. Eligible sales earn commission when payment is confirmed."}
            </p>
          ) : (
            commissions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="font-medium tabular-nums text-[#0a1a2e]">
                    {fmtCurrency(item.amount)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fmtDate(item.created_at)} · {Number((item.rate * 100).toFixed(2))}%{" "}
                    {item.type.replace(/_/g, " ")}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-xl text-[#0a1a2e]">Payouts</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          {payouts === null ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              No payouts yet. Approved commission is paid out by the store.
            </p>
          ) : (
            payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="font-medium tabular-nums text-[#0a1a2e]">
                    {fmtCurrency(payout.amount)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fmtDate(payout.created_at)}
                    {payout.method ? ` · ${payout.method}` : ""}
                  </p>
                </div>
                <StatusBadge status={payout.status} />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

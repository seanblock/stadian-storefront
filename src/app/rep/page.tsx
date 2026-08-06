"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RepDashboard, RepOrderSummary } from "@stadian/storefront-sdk";
import { getRepDashboard, getRepOrders } from "@/app/actions/rep";
import { StatCard } from "@/components/rep/stat-card";
import { fmtCurrency, fmtDate } from "@/components/rep/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const GOLD = "#d4a951";
const NAVY = "#0a1a2e";

function paymentBadge(order: RepOrderSummary) {
  if (order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
    return <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>;
  }
  if (order.status === "cancelled" || order.status === "refunded") {
    return <Badge variant="outline">{order.status}</Badge>;
  }
  if (order.payment_link_status) {
    return <Badge className="bg-amber-100 text-amber-800">Link sent</Badge>;
  }
  return <Badge variant="secondary">Unpaid</Badge>;
}

export default function RepDashboardPage() {
  const [dashboard, setDashboard] = useState<RepDashboard | null>(null);
  const [orders, setOrders] = useState<RepOrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRepDashboard().then((r) => {
      if (r.ok) setDashboard(r.data);
      else setError(r.message);
    });
    getRepOrders({ limit: 10 }).then((r) => setOrders(r.ok ? r.data.items : []));
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Quick actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="h-16 flex-1 text-lg"
          style={{ background: GOLD, color: NAVY }}
          render={<Link href="/rep/new-sale" />}
        >
          New Sale
        </Button>
        <Button variant="outline" className="h-16 bg-white px-8" render={<Link href="/rep/customers" />}>
          Customers
        </Button>
        <Button variant="outline" className="h-16 bg-white px-8" render={<Link href="/rep/orders" />}>
          Orders
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Stats */}
      {dashboard ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Today" value={fmtCurrency(dashboard.today.revenue)} hint={`${dashboard.today.count} orders`} />
          <StatCard label="This week" value={fmtCurrency(dashboard.this_week.revenue)} hint={`${dashboard.this_week.count} orders`} />
          <StatCard label="This month" value={fmtCurrency(dashboard.this_month.revenue)} hint={`${dashboard.this_month.count} orders`} />
          <StatCard label="All time" value={fmtCurrency(dashboard.all_time.revenue)} hint={`${dashboard.all_time.count} orders`} />
          <StatCard
            label="Commission pending"
            value={fmtCurrency(dashboard.commissions.pending)}
            accent
            hint={
              dashboard.commission_rate != null
                ? `${Math.round(dashboard.commission_rate * 100)}% rate`
                : undefined
            }
          />
          <StatCard
            label="Commission earned"
            value={fmtCurrency(dashboard.commissions.approved + dashboard.commissions.paid)}
            accent
            hint={`${fmtCurrency(dashboard.commissions.paid)} paid out`}
          />
        </div>
      ) : (
        !error && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        )
      )}

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-xl font-normal text-[#0a1a2e]">
            Recent sales
          </CardTitle>
          <Link href="/rep/orders" className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {orders === null ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No sales yet — start your first one.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/rep/orders/${order.id}`}
                    className="flex min-h-14 items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40"
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
                      {paymentBadge(order)}
                      <span className="font-medium tabular-nums">
                        {fmtCurrency(order.total)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

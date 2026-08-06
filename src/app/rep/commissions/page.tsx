"use client";

import { useEffect, useState } from "react";
import type {
  RepDashboard,
  StorefrontCommission,
  StorefrontPayout,
} from "@stadian/storefront-sdk";
import { getCommissions, getPayouts } from "@/app/actions/affiliate";
import { getRepDashboard } from "@/app/actions/rep";
import { StatCard } from "@/components/rep/stat-card";
import { fmtCurrency, fmtDate } from "@/components/rep/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_STYLE[status] ?? "bg-muted text-muted-foreground"}>
      {status}
    </Badge>
  );
}

export default function RepCommissionsPage() {
  const [dashboard, setDashboard] = useState<RepDashboard | null>(null);
  const [commissions, setCommissions] = useState<StorefrontCommission[] | null>(null);
  const [payouts, setPayouts] = useState<StorefrontPayout[] | null>(null);

  useEffect(() => {
    getRepDashboard().then((r) => setDashboard(r.ok ? r.data : null));
    getCommissions({ limit: 50 }).then((r) => setCommissions(r.items));
    getPayouts({ limit: 50 }).then((r) => setPayouts(r.items));
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6 sm:px-6">
      <h1 className="font-serif text-3xl text-[#0a1a2e]">Commissions</h1>

      {dashboard ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Pending" value={fmtCurrency(dashboard.commissions.pending)} />
          <StatCard label="Approved" value={fmtCurrency(dashboard.commissions.approved)} />
          <StatCard label="Paid out" value={fmtCurrency(dashboard.commissions.paid)} accent />
          <StatCard
            label="Your rate"
            value={
              dashboard.commission_rate != null
                ? `${Math.round(dashboard.commission_rate * 100)}%`
                : "—"
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl font-normal text-[#0a1a2e]">
            Commission history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissions === null ? (
            <Skeleton className="h-32" />
          ) : commissions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Commissions appear here once your sales are paid.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {commissions.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="flex flex-col">
                    <span className="font-medium tabular-nums text-[#0a1a2e]">
                      {fmtCurrency(c.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(c.created_at)} · {Math.round(c.rate * 100)}% {c.type}
                    </span>
                  </span>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl font-normal text-[#0a1a2e]">
            Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payouts === null ? (
            <Skeleton className="h-24" />
          ) : payouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payouts yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {payouts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="flex flex-col">
                    <span className="font-medium tabular-nums text-[#0a1a2e]">
                      {fmtCurrency(p.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(p.created_at)}
                      {p.method ? ` · ${p.method}` : ""}
                    </span>
                  </span>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

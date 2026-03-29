"use client";

import { useEffect, useState, useCallback } from "react";
import { getPayouts } from "@/app/actions/affiliate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { StorefrontPayout } from "@stadian/storefront-sdk";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  sent: "default",
  paid: "default",
  failed: "destructive",
  cancelled: "outline",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMethod(method: string) {
  return method
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<StorefrontPayout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = useCallback(async () => {
    try {
      const result = await getPayouts({ limit: 50 });
      setPayouts(result.items);
    } catch {
      // silently fail — empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          History of all affiliate payouts made to your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>All payouts processed for your affiliate account.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          ) : payouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payouts yet. Approved commissions will be paid out on a regular schedule.
            </p>
          ) : (
            <div className="flex flex-col gap-0">
              {payouts.map((payout, index) => (
                <div key={payout.id}>
                  {index > 0 && <Separator />}
                  <div className="flex items-start justify-between gap-4 py-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatMethod(payout.method)}
                        </span>
                        <Badge variant={statusVariant[payout.status] ?? "outline"}>
                          {payout.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Requested {formatDate(payout.created_at)}</span>
                        {payout.sent_at && (
                          <>
                            <span>·</span>
                            <span>Sent {formatDate(payout.sent_at)}</span>
                          </>
                        )}
                      </div>
                      {payout.reference && (
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          Ref: {payout.reference}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(payout.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

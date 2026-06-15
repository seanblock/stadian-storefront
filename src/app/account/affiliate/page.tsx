"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getCommissions } from "@/app/actions/affiliate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { StorefrontCommission } from "@stadian/storefront-sdk";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  paid: "default",
  denied: "destructive",
  held: "outline",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AffiliateDashboardPage() {
  const { customer } = useAuth();
  const [commissions, setCommissions] = useState<StorefrontCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchCommissions = useCallback(async () => {
    try {
      const result = await getCommissions({ limit: 10 });
      setCommissions(result.items);
    } catch {
      // silently fail — empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchCommissions is a useCallback async fetcher; setState is indirect, not inline
    fetchCommissions();
  }, [fetchCommissions]);

  if (!customer) return null;

  const affiliateCode = customer.affiliate_code ?? "";
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = affiliateCode
    ? `${baseUrl}/?ref=${affiliateCode}`
    : "";

  const commissionRate =
    commissions.length > 0 ? commissions[0].rate : customer.commission_rate;

  const totalEarned = commissions
    .filter((c) => c.status === "approved" || c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingAmount = commissions
    .filter((c) => c.status === "pending" || c.status === "held")
    .reduce((sum, c) => sum + c.amount, 0);

  async function handleCopy() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Affiliate Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your commissions and referral activity.
        </p>
      </div>

      {/* Referral link card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link to earn commissions on referred purchases.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-lg border border-border bg-muted px-3 py-2 text-xs">
              {referralLink || "—"}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!referralLink}
              className="shrink-0"
            >
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Affiliate code: </span>
              <span className="font-mono font-medium">{affiliateCode || "—"}</span>
            </div>
            {commissionRate != null && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div>
                  <span className="text-muted-foreground">Commission rate: </span>
                  <span className="font-medium">
                    {(commissionRate * 100).toFixed(0)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total earned</CardDescription>
            <CardTitle className="text-lg">
              {loading ? "—" : formatCurrency(totalEarned)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-lg">
              {loading ? "—" : formatCurrency(pendingAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
          <CardDescription>Your last 10 commission records.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          ) : commissions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No commissions yet. Start sharing your referral link!
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {commissions.map((commission, index) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      Order {commission.order_id}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(commission.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={
                        statusVariant[commission.status] ?? "outline"
                      }
                    >
                      {commission.status}
                    </Badge>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(commission.amount)}
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

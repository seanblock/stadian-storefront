"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { RepOrderSummary } from "@stadian/storefront-sdk";
import { getRepOrder } from "@/app/actions/rep";
import { PayLinkResult } from "@/components/rep/pay-link-result";
import { fmtCurrency, fmtDate } from "@/components/rep/format";
import { resendPaymentLink } from "@/app/actions/rep";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function RepOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<RepOrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRepOrder(id).then((r) => {
      if (r.ok) setOrder(r.data);
      else setError(r.message);
    });
  }, [id]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
      <Link
        href="/rep/orders"
        className="flex h-11 w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All sales
      </Link>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!order && !error && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64" />
        </div>
      )}

      {order && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl text-[#0a1a2e]">
                {order.order_number ? `Order ${order.order_number}` : "Order"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {fmtDate(order.created_at)} · {order.customer_name || order.customer_email}
              </p>
            </div>
            <Badge variant={order.status === "pending_payment" ? "secondary" : "outline"}>
              {order.status.replace(/_/g, " ")}
            </Badge>
          </div>

          {order.status === "pending_payment" && order.payment_link_url && (
            <PayLinkResult
              url={order.payment_link_url}
              onResend={async () => (await resendPaymentLink(order.id)).ok}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl font-normal text-[#0a1a2e]">
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>
                      {item.product_name || "Product"}
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                    </span>
                    <span className="tabular-nums">{fmtCurrency(item.line_total)}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-3" />
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{fmtCurrency(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Savings</span>
                    <span className="tabular-nums">−{fmtCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="tabular-nums">{fmtCurrency(order.tax_amount)}</span>
                  </div>
                )}
                {order.shipping_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="tabular-nums">{fmtCurrency(order.shipping_amount)}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-medium text-[#0a1a2e]">
                  <span>Total</span>
                  <span className="font-serif text-xl tabular-nums">{fmtCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

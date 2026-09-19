"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { RepOrderSummary } from "@stadian/storefront-sdk";
import { getRepOrder } from "@/app/actions/rep";
import { PayLinkResult } from "@/components/rep/pay-link-result";
import { fmtDate } from "@/components/rep/format";
import { resendPaymentLink } from "@/app/actions/rep";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderReceipt } from "@/components/checkout/order-receipt";
import { OrderTracking } from "@/components/checkout/order-tracking";
import { ProductCoaButton } from "@/components/rep/product-coa-button";
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
              <OrderReceipt order={{ ...order, items: order.items.map((item, index) => ({
                ...item, id: `${item.product_id}-${index}`, product_name: item.product_name || "Unavailable product",
              })) }} totalLabel={order.status === "pending_payment" ? "Total due" : "Total"} />
              {order.items.filter((item) => item.has_coa && item.product_slug).map((item) => (
                <ProductCoaButton key={item.product_id} slug={item.product_slug!} name={item.product_name || "Product"} />
              ))}
            </CardContent>
          </Card>
          <OrderTracking order={order} />
          <section aria-label="Customer follow-up" className="rounded-lg border p-4 text-sm">
            <h2 className="font-medium">Customer follow-up</h2>
            {order.customer_email && <a className="mt-2 block break-all underline" href={`mailto:${order.customer_email}`}>{order.customer_email}</a>}
            {order.status === "pending_payment" && !order.payment_link_url && <p className="mt-2">This order is awaiting offline payment. Ask your store administrator for payment instructions before following up with the customer.</p>}
            <p className="mt-2 text-muted-foreground">For an invoice copy, an order change or cancellation, missing tracking, or a batch-specific COA, contact your store administrator and include order #{order.order_number || order.id}.</p>
            <Link href="/faq" className="mt-2 inline-flex min-h-11 items-center underline">Store help and policies</Link>
          </section>
        </>
      )}
    </div>
  );
}

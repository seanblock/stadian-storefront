"use client";
import Link from "next/link";
import { CheckCircle2, Mail, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ConfirmedOrder {
  id: string;
  order_number?: string | null;
  status: string;
  total: number;
  payment_status?: string | null;
}

export function OrderConfirmation({
  order,
  email,
}: {
  order: ConfirmedOrder;
  email: string;
}) {
  const orderRef = order.order_number
    ? `#${order.order_number}`
    : `#${order.id.slice(0, 8)}`;
  const paid =
    order.status === "paid" ||
    order.payment_status === "paid" ||
    order.payment_status === "success";

  return (
    <div className="container mx-auto max-w-xl px-4 py-16 sm:py-20">
      {/* Success header */}
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/60">
          <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Thank you for your order
        </h1>
        <p className="mt-2 text-muted-foreground">
          It&rsquo;s confirmed and we&rsquo;re getting it ready.
        </p>
      </div>

      {/* Order card */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Package className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Order {orderRef}</span>
          </div>
          {paid ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/60 dark:text-green-400">
              Paid
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
              {order.status.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-muted-foreground">Total paid</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>

      {/* Email note */}
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted/50 px-4 py-3.5 text-sm">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          A receipt is on its way to{" "}
          <span className="font-medium text-foreground">{email}</span>. We&rsquo;ll
          email you again with tracking as soon as it ships.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center">
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/products" />}
          className="w-full sm:w-auto sm:min-w-56"
        >
          Continue shopping
        </Button>
      </div>
    </div>
  );
}

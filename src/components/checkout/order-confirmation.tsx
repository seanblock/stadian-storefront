"use client";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ConfirmedOrder {
  id: string; order_number?: number | null; status: string; total: number; payment_status?: string | null;
}

export function OrderConfirmation({ order, email }: { order: ConfirmedOrder; email: string }) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader><CardTitle>Thank you — your order is placed</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm">Order {order.order_number ? `#${order.order_number}` : order.id}</p>
          <p className="text-sm text-muted-foreground">Status: {order.status}</p>
          <p className="text-sm">Total: <span className="tabular-nums">{formatCurrency(order.total)}</span></p>
          <p className="text-sm text-muted-foreground">A confirmation was sent to {email}.</p>
          <Link href="/products" className="text-sm font-medium text-primary underline">Continue shopping</Link>
        </CardContent>
      </Card>
    </div>
  );
}

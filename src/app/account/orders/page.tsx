"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrderHistoryPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your past and current orders.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No orders yet</CardTitle>
          <CardDescription>
            When you place an order, it will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm">
            <Link href="/products">Browse products</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

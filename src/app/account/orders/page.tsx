import Link from "next/link";
import { getOrderHistory } from "@/app/actions/account";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function OrderHistoryPage() {
  const orders = await getOrderHistory();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your past and current orders.
        </p>
      </div>

      {orders.items.length === 0 ? (
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
      ) : (
        <div className="flex flex-col gap-3">
          {orders.items.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      #{order.order_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="capitalize">
                      {order.status}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

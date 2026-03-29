import type { StorefrontCart } from "@stadian/storefront-sdk";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

interface OrderSummaryProps {
  cart: StorefrontCart;
}

export function OrderSummary({ cart }: OrderSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatCurrency(cart.subtotal)}</span>
        </div>

        {cart.discount_amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Discount
              {cart.promotion_code && (
                <span className="ml-1 font-mono text-xs">
                  ({cart.promotion_code})
                </span>
              )}
            </span>
            <span className="tabular-nums text-green-600 dark:text-green-400">
              −{formatCurrency(cart.discount_amount)}
            </span>
          </div>
        )}

        {cart.tax_amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="tabular-nums">{formatCurrency(cart.tax_amount)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(cart.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import type { StorefrontCartItem } from "@stadian/storefront-sdk";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/providers/cart-provider";
import { formatCurrency } from "@/lib/utils";

interface CartItemRowProps {
  item: StorefrontCartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateItem, removeItem } = useCart();

  function handleDecrement() {
    if (item.quantity <= 1) {
      removeItem(item.id);
    } else {
      updateItem(item.id, item.quantity - 1);
    }
  }

  function handleIncrement() {
    updateItem(item.id, item.quantity + 1);
  }

  function handleRemove() {
    removeItem(item.id);
  }

  return (
    <div>
      <div className="flex items-center gap-4 py-4">
        {/* Product name */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/products/${item.product_slug}`}
            className="text-sm font-medium hover:underline"
          >
            {item.product_name}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatCurrency(item.unit_price)} each
          </p>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDecrement}
            aria-label="Decrease quantity"
          >
            −
          </Button>
          <span className="w-8 text-center text-sm tabular-nums">
            {item.quantity}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleIncrement}
            aria-label="Increase quantity"
          >
            +
          </Button>
        </div>

        {/* Line total */}
        <div className="w-20 text-right text-sm font-medium tabular-nums">
          {formatCurrency(item.line_total)}
        </div>

        {/* Remove */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          aria-label={`Remove ${item.product_name} from cart`}
          className="text-muted-foreground hover:text-destructive"
        >
          ✕
        </Button>
      </div>
      <Separator />
    </div>
  );
}

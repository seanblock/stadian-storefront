"use client";

import Link from "next/link";
import type { StorefrontCartItem } from "@stadian/storefront-sdk";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartItemActions } from "./use-cart-item-actions";
import { formatCurrency } from "@/lib/utils";

interface CartItemRowProps {
  item: StorefrontCartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const actions = useCartItemActions(item);

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
        {actions.limitMessage && <p className="mt-1 text-xs text-muted-foreground">{actions.limitMessage}</p>}
        {actions.error && <p role="alert" className="mt-1 text-xs text-destructive">{actions.error}</p>}
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={actions.busy}
          onClick={actions.decrease}
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
            disabled={actions.busy || actions.atMax}
            onClick={actions.increase}
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
          disabled={actions.busy}
          onClick={actions.remove}
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

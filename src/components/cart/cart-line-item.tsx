"use client";

import Link from "next/link";
import Image from "next/image";
import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";
import type { StorefrontCartItem } from "@stadian/storefront-sdk";
import { Button } from "@/components/ui/button";
import { useCartItemActions } from "./use-cart-item-actions";
import { formatCurrency } from "@/lib/utils";

interface CartLineItemProps {
  item: StorefrontCartItem;
  /** Called when a product link is followed (e.g. to close the cart drawer). */
  onNavigate?: () => void;
}

/**
 * A single editable cart row — image, name, unit price, quantity stepper,
 * line total, and remove — wired directly to the cart provider. Shared by the
 * cart drawer and the checkout order summary so both stay in sync.
 */
export function CartLineItem({ item, onNavigate }: CartLineItemProps) {
  const actions = useCartItemActions(item);

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Product image */}
      <Link
        href={`/products/${item.product_slug}`}
        onClick={onNavigate}
        className="relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted"
      >
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.product_name}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-5 w-5 opacity-30" />
          </div>
        )}
      </Link>

      {/* Product info */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${item.product_slug}`}
          onClick={onNavigate}
          className="text-sm font-medium leading-tight hover:underline"
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
          variant="outline"
          size="icon-sm"
          disabled={actions.busy}
          onClick={actions.decrease}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-7 text-center text-sm tabular-nums">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={actions.busy || actions.atMax}
          onClick={actions.increase}
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Line total and remove */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-medium tabular-nums">
          {formatCurrency(item.line_total)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={actions.busy}
          onClick={actions.remove}
          aria-label={`Remove ${item.product_name} from cart`}
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

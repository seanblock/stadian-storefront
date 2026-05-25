"use client";

import Link from "next/link";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/providers/cart-provider";
import { formatCurrency } from "@/lib/utils";

export function CartDrawer() {
  const { cart, isDrawerOpen, setDrawerOpen, updateItem, removeItem } =
    useCart();

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  function handleDecrement(itemId: string, currentQuantity: number) {
    if (currentQuantity <= 1) {
      removeItem(itemId);
    } else {
      updateItem(itemId, currentQuantity - 1);
    }
  }

  function handleIncrement(itemId: string, currentQuantity: number) {
    updateItem(itemId, currentQuantity + 1);
  }

  return (
    <Sheet
      open={isDrawerOpen}
      onOpenChange={(open) => setDrawerOpen(open)}
    >
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            {isEmpty
              ? "Your cart is empty."
              : `${items.reduce((sum, i) => sum + i.quantity, 0)} item${items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? "" : "s"} in your cart`}
          </SheetDescription>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">
              Add some products to get started.
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/products" />}
              onClick={() => setDrawerOpen(false)}
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <>
            {/* Scrollable items list */}
            <div className="flex-1 overflow-y-auto px-4">
              {items.map((item) => (
                <div key={item.id}>
                  <div className="flex items-start gap-3 py-3">
                    {/* Product info */}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.product_slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className="text-sm font-medium leading-tight hover:underline"
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
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          handleDecrement(item.id, item.quantity)
                        }
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
                        onClick={() =>
                          handleIncrement(item.id, item.quantity)
                        }
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
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.product_name} from cart`}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>

            {/* Totals and actions */}
            <SheetFooter className="border-t pt-4">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(cart?.subtotal ?? 0)}
                  </span>
                </div>

                {cart && cart.discount_amount > 0 && (
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

                <Separator />

                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(cart?.total ?? 0)}
                  </span>
                </div>

                <Button
                  className="w-full mt-2"
                  nativeButton={false}
                  render={<Link href="/checkout" />}
                  onClick={() => setDrawerOpen(false)}
                >
                  Checkout
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setDrawerOpen(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

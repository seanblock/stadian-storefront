"use client";

import { useState } from "react";
import type { CheckoutQuote, StorefrontCart } from "@stadian/storefront-sdk";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getSessionId } from "@/lib/session";
import { applyDiscountCode } from "@/app/actions/cart";
import { useCart } from "@/providers/cart-provider";
import { cartTaxDisplay, summaryTotal } from "@/lib/tax-display";
import { CartLineItem } from "./cart-line-item";

interface OrderSummaryProps {
  cart: StorefrontCart;
  shippingCost?: number;
  showItems?: boolean;
  /** Checkout quote for the entered address (stores that tax by destination). */
  quote?: CheckoutQuote | null;
}

export function OrderSummary({ cart, shippingCost, showItems = true, quote }: OrderSummaryProps) {
  const tax = cartTaxDisplay(cart, quote);
  const { refresh } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  async function handleApplyPromo() {
    const code = promoCode.trim();
    if (!code) return;

    setPromoError(null);
    setApplying(true);

    try {
      const sessionId = getSessionId();
      const result = await applyDiscountCode(sessionId, code);
      if (result.success) {
        setPromoCode("");
        await refresh(); // re-fetch the cart into client state so the discount shows immediately
      } else {
        setPromoError(result.error ?? "Failed to apply code");
      }
    } catch {
      setPromoError("Something went wrong. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Editable cart line items — kept in sync with the drawer via useCart */}
        {showItems && cart.items.length > 0 && (
          <>
            <div className="-my-1 flex flex-col divide-y">
              {cart.items.map((item) => (
                <CartLineItem key={item.id} item={item} />
              ))}
            </div>
            <Separator />
          </>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatCurrency(cart.subtotal)}</span>
        </div>

        {cart.discount_amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Discount
              {(cart.promotion_code ?? cart.discount_code) && (
                <span className="ml-1 font-mono text-xs uppercase">
                  ({cart.promotion_code ?? cart.discount_code})
                </span>
              )}
            </span>
            <span className="tabular-nums text-green-600 dark:text-green-400">
              −{formatCurrency(cart.discount_amount)}
            </span>
          </div>
        )}

        <div className="flex justify-between gap-3 text-sm" data-testid="summary-tax">
          <span className="text-muted-foreground">{tax.label}</span>
          <span className="shrink-0 tabular-nums">
            {tax.amount === null ? (
              <span className="text-muted-foreground">Calculated at checkout</span>
            ) : (
              formatCurrency(tax.amount)
            )}
          </span>
        </div>

        {shippingCost !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="tabular-nums">
              {cart.free_shipping ? (
                <>
                  {shippingCost > 0 && (
                    <span className="mr-1 text-muted-foreground line-through">
                      {formatCurrency(shippingCost)}
                    </span>
                  )}
                  <span className="text-green-600 dark:text-green-400">Free</span>
                </>
              ) : shippingCost === 0 ? (
                "Free"
              ) : (
                formatCurrency(shippingCost)
              )}
            </span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span className="tabular-nums">
            {formatCurrency(summaryTotal(cart, shippingCost, quote))}
          </span>
        </div>

        {/* Promo code section */}
        <Separator />
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Have a promo code?
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setPromoError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyPromo();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={applying || !promoCode.trim()}
                onClick={handleApplyPromo}
              >
                {applying ? "..." : "Apply"}
              </Button>
            </div>
            {promoError && (
              <p className="text-xs text-destructive">{promoError}</p>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

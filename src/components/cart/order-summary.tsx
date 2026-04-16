"use client";

import { useState } from "react";
import type { StorefrontCart } from "@stadian/storefront-sdk";
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

interface OrderSummaryProps {
  cart: StorefrontCart;
}

export function OrderSummary({ cart }: OrderSummaryProps) {
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
      if (!result.success) {
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

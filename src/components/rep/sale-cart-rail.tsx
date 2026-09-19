"use client";

import { useEffect, useRef, useState } from "react";
import type { RepCustomer, StorefrontCart } from "@stadian/storefront-sdk";
import { QtyStepper } from "@/components/rep/qty-stepper";
import { fmtCurrency } from "@/components/rep/format";
import { Badge } from "@/components/ui/badge";
import { cartQuantityLimits } from "@/lib/cart-quantity";

/**
 * The persistent running-order rail: selected customer, cart lines with
 * steppers, totals. Rendered as a right rail on wide screens; the parent
 * collapses it on phones.
 */
export function SaleCartRail({
  customer,
  cart,
  cartBusy,
  shippingLabel,
  onSetQuantity,
  onRemove,
  onRestore,
  onChangeCustomer,
}: {
  customer: RepCustomer | null;
  cart: StorefrontCart | null;
  cartBusy: boolean;
  shippingLabel?: string | null;
  onSetQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  /** Put a removed line back — enables the undo affordance. */
  onRestore?: (productId: string, quantity: number) => void;
  onChangeCustomer?: () => void;
}) {
  const items = cart?.items ?? [];
  const HeaderTag = onChangeCustomer ? "button" : "div";

  // Removing a line is instant with a short undo rather than a confirm dialog.
  // Voiding a line is cheap to reverse and happens constantly; a modal in the
  // middle of a sale costs more than the mistake does.
  const [undo, setUndo] = useState<{ productName: string; quantity: number; productId: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  function handleRemove(item: { id: string; product_id: string; product_name: string; quantity: number }) {
    onRemove(item.id);
    setUndo({
      productName: item.product_name,
      quantity: item.quantity,
      productId: item.product_id,
    });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
  }

  function handleUndo() {
    if (!undo || !onRestore) return;
    const restoring = undo;
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    onRestore(restoring.productId, restoring.quantity);
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-white">
      {/* The whole header is the customer control — attaching and changing are
          the same action, and duplicating it elsewhere on the screen just gives
          a rep two places to look. */}
      <HeaderTag
        {...(onChangeCustomer
          ? { type: "button" as const, onClick: onChangeCustomer }
          : {})}
        className={`flex min-h-16 w-full shrink-0 items-center justify-between gap-2 border-b border-border p-4 text-left ${
          onChangeCustomer ? "transition-colors hover:bg-muted/50" : ""
        }`}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Selling to
          </p>
          {customer ? (
            <p className="truncate font-medium text-[#0a1a2e]">
              {customer.name || customer.email}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {onChangeCustomer ? "Tap to attach a customer" : "No customer selected"}
            </p>
          )}
        </div>
        {onChangeCustomer && (
          <span className="flex h-9 shrink-0 items-center rounded-md border border-border px-3 text-xs font-medium">
            {customer ? "Change" : "Attach"}
          </span>
        )}
      </HeaderTag>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Tap products to add them to the order.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-snug text-[#0a1a2e]">
                    {item.product_name}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">
                    {fmtCurrency(item.line_total)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <QtyStepper
                    size="sm"
                    quantity={item.quantity}
                    disabled={cartBusy}
                    min={cartQuantityLimits(item).min}
                    max={cartQuantityLimits(item).max}
                    onChange={(next) =>
                      next <= 0 ? handleRemove(item) : onSetQuantity(item.id, next)
                    }
                  />
                  {cartQuantityLimits(item).atMax && <span className="text-xs text-muted-foreground">At limit</span>}
                  <button
                    type="button"
                    disabled={cartBusy}
                    onClick={() => handleRemove(item)}
                    className="h-9 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {undo && onRestore && (
        <div
          role="status"
          className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-[#0a1a2e] px-3 py-2 text-sm text-white"
        >
          <span className="truncate">Removed {undo.productName}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="h-9 shrink-0 rounded-md px-3 text-xs font-medium uppercase tracking-[0.14em]"
            style={{ color: "#d4a951" }}
          >
            Undo
          </button>
        </div>
      )}

      {cart && (
        <div className="shrink-0 border-t border-border p-4 text-sm">
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{fmtCurrency(cart.subtotal)}</span>
          </div>
          {cart.discount_amount > 0 && (
            <div className="flex justify-between py-0.5 text-emerald-700">
              <span className="flex items-center gap-1.5">
                Savings
                {cart.discount_code && <Badge variant="secondary">{cart.discount_code}</Badge>}
              </span>
              <span className="tabular-nums">−{fmtCurrency(cart.discount_amount)}</span>
            </div>
          )}
          {cart.tax_amount > 0 && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">{fmtCurrency(cart.tax_amount)}</span>
            </div>
          )}
          {shippingLabel && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Shipping</span>
              <span className="tabular-nums">{shippingLabel}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-medium text-[#0a1a2e]">
            <span>Total</span>
            <span className="font-serif text-xl tabular-nums">
              {fmtCurrency(cart.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

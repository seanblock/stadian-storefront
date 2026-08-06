"use client";

import type { RepCustomer, StorefrontCart } from "@stadian/storefront-sdk";
import { QtyStepper } from "@/components/rep/qty-stepper";
import { fmtCurrency } from "@/components/rep/format";
import { Badge } from "@/components/ui/badge";

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
  onChangeCustomer,
}: {
  customer: RepCustomer | null;
  cart: StorefrontCart | null;
  cartBusy: boolean;
  shippingLabel?: string | null;
  onSetQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onChangeCustomer?: () => void;
}) {
  const items = cart?.items ?? [];

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-border p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Selling to
          </p>
          {customer ? (
            <p className="truncate font-medium text-[#0a1a2e]">
              {customer.name || customer.email}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No customer selected</p>
          )}
        </div>
        {customer && onChangeCustomer && (
          <button
            type="button"
            onClick={onChangeCustomer}
            className="h-9 shrink-0 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
          >
            Change
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
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
                    onChange={(next) =>
                      next <= 0 ? onRemove(item.id) : onSetQuantity(item.id, next)
                    }
                  />
                  <button
                    type="button"
                    disabled={cartBusy}
                    onClick={() => onRemove(item.id)}
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

      {cart && (
        <div className="border-t border-border p-4 text-sm">
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

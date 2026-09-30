"use client";

import { useState } from "react";
import type { CheckoutQuote, RepCustomer, StorefrontCart } from "@stadian/storefront-sdk";
import { cartTotalWithTax } from "@/lib/tax-display";
import { SaleCartRail } from "@/components/rep/sale-cart-rail";
import { fmtCurrency } from "@/components/rep/format";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ChevronUp } from "lucide-react";

const NAVY = "#0a1a2e";

/**
 * The running order on screens too narrow for the right rail (below lg — every
 * phone, and a tablet held in portrait). A POS must never hide what the order
 * costs, so line count and total stay pinned to the bottom edge; tapping opens
 * the full order in a sheet. The bar doubles as the primary reach target: the
 * bottom edge is where a thumb rests on both a phone and a two-handed tablet.
 */
export function SaleOrderBar({
  customer,
  cart,
  cartBusy,
  onSetQuantity,
  onRemove,
  onChangeCustomer,
  shippingLabel,
  taxQuote,
}: {
  customer: RepCustomer | null;
  cart: StorefrontCart | null;
  cartBusy: boolean;
  onSetQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onChangeCustomer?: () => void;
  shippingLabel?: string | null;
  taxQuote?: CheckoutQuote | null;
}) {
  const [open, setOpen] = useState(false);
  const total = cart ? cartTotalWithTax(cart, taxQuote) : 0;
  const items = cart?.items ?? [];
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={count === 0}
        aria-label={
          count === 0
            ? "No items in the order yet"
            : `Review order — ${count} ${count === 1 ? "item" : "items"}, ${fmtCurrency(total)}`
        }
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-4 text-white transition-opacity disabled:opacity-45"
        style={{ background: NAVY }}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-medium tabular-nums">
            {count}
          </span>
          <span className="truncate text-sm">
            {customer ? (customer.name ?? customer.email) : "No customer yet"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="font-serif text-xl tabular-nums">
            {fmtCurrency(total)}
          </span>
          <ChevronUp className="size-4 opacity-70" aria-hidden />
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] p-0">
          <SheetTitle className="sr-only">Current order</SheetTitle>
          <div className="flex max-h-[85dvh] flex-col p-3">
            <SaleCartRail
              customer={customer}
              cart={cart}
              cartBusy={cartBusy}
              shippingLabel={shippingLabel}
              taxQuote={taxQuote}
              onSetQuantity={onSetQuantity}
              onRemove={onRemove}
              onChangeCustomer={
                onChangeCustomer
                  ? () => {
                      setOpen(false);
                      onChangeCustomer();
                    }
                  : undefined
              }
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

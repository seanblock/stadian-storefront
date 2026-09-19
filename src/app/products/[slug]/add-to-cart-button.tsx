"use client";

import { useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productId: string;
  /** Units available now. Null means inventory isn't tracked — no cap. */
  availableQuantity?: number | null;
  inStock?: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number | null;
}

/**
 * The quantity stepper used to increment without limit, and the product's own
 * min/max order quantity was never applied on the storefront at all — a buyer
 * only found out at checkout, as a 422 after filling in payment details.
 */
export function AddToCartButton({
  productId,
  availableQuantity = null,
  inStock = true,
  minOrderQuantity = 1,
  maxOrderQuantity = null,
}: AddToCartButtonProps) {
  const { addItem, cart } = useCart();
  const min = Math.max(1, minOrderQuantity);
  const [quantity, setQuantity] = useState(min);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The tightest of: what's on the shelf, and what the merchant allows per order.
  const caps = [availableQuantity, maxOrderQuantity].filter(
    (n): n is number => typeof n === "number"
  );
  const totalMax = caps.length > 0 ? Math.min(...caps) : null;
  const inCart = cart?.items.find((item) => item.product_id === productId)?.quantity ?? 0;
  const max = totalMax !== null ? Math.max(0, totalMax - inCart) : null;
  const limitReached = max !== null && max < min;
  const selectedQuantity = max !== null ? Math.min(quantity, max) : quantity;
  const soldOut = !inStock || (availableQuantity != null && availableQuantity < min);
  const atMax = max != null && selectedQuantity >= max;

  const handleAdd = async () => {
    setAdding(true);
    setError(null);
    try {
      if (limitReached) return;
      await addItem(productId, selectedQuantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      // Surface the failure instead of silently resetting to "Add to Cart".
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't add this item to your cart. Please try again."
      );
    } finally {
      setAdding(false);
    }
  };

  if (soldOut) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          className="h-14 w-full rounded-full text-sm font-bold uppercase tracking-[0.22em]"
          size="lg"
          disabled
        >
          Out of Stock
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          This product is temporarily unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Quantity */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Qty
        </span>
        <div className="flex h-10 items-center rounded-lg bg-muted">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity(Math.max(min, selectedQuantity - 1))}
            disabled={limitReached || selectedQuantity <= min}
            className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h8" /></svg>
          </button>
          <span className="flex h-full min-w-[2.5rem] items-center justify-center text-sm font-semibold tabular-nums">
            {selectedQuantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity(max != null ? Math.min(max, selectedQuantity + 1) : selectedQuantity + 1)}
            disabled={atMax}
            className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 3v8M3 7h8" /></svg>
          </button>
        </div>

        {min > 1 && (
          <span className="text-xs text-muted-foreground">Min {min}</span>
        )}
        {availableQuantity != null && availableQuantity <= 10 && (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
            Only {availableQuantity} left
          </span>
        )}
        {availableQuantity == null && atMax && maxOrderQuantity != null && (
          <span className="text-xs text-muted-foreground">Max {maxOrderQuantity} per order</span>
        )}
      </div>

      {/* Add to Cart — full width, brand gold */}
      <Button
        className="h-14 w-full rounded-full text-sm font-bold uppercase tracking-[0.22em] transition-transform duration-300 hover:-translate-y-0.5"
        size="lg"
        onClick={handleAdd}
        disabled={adding || limitReached}
        style={{
          background: "#d4a951",
          color: "#0a1a2e",
          boxShadow: "0 20px 50px -20px #d4a95188",
        }}
      >
        {adding ? "Adding..." : limitReached ? "Cart limit reached" : added ? "Added to Cart" : "Add to Cart"}
      </Button>

      {limitReached && <p className="text-sm text-muted-foreground">Your cart already contains the maximum available quantity for this order.</p>}

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

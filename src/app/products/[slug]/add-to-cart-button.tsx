"use client";

import { useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productId: string;
}

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setAdding(true);
    setError(null);
    try {
      await addItem(productId, quantity);
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
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h8" /></svg>
          </button>
          <span className="flex h-full min-w-[2.5rem] items-center justify-center text-sm font-semibold tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 3v8M3 7h8" /></svg>
          </button>
        </div>
      </div>

      {/* Add to Cart — full width, prominent */}
      <Button
        className="h-14 w-full text-base font-bold tracking-wide uppercase"
        size="lg"
        onClick={handleAdd}
        disabled={adding}
      >
        {adding ? "Adding..." : added ? "Added to Cart" : "Add to Cart"}
      </Button>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

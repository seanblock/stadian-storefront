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

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addItem(productId, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center rounded-lg border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        >
          -
        </Button>
        <span className="min-w-[2rem] text-center text-sm font-medium">
          {quantity}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setQuantity((q) => q + 1)}
        >
          +
        </Button>
      </div>

      <Button
        className="flex-1"
        size="lg"
        onClick={handleAdd}
        disabled={adding}
      >
        {adding ? "Adding..." : added ? "Added!" : "Add to Cart"}
      </Button>
    </div>
  );
}

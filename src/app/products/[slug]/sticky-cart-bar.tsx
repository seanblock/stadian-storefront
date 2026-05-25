"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StickyCartBarProps {
  productName: string;
  price: number | null;
  currency: string;
  productId: string;
  /** DOM id of the element to observe — sticky bar appears when this scrolls out of view */
  observeId?: string;
}

export function StickyCartBar({
  productName,
  price,
  currency,
  productId,
  observeId = "cart-button-area",
}: StickyCartBarProps) {
  const { addItem } = useCart();
  const [visible, setVisible] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const target = document.getElementById(observeId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [observeId]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addItem(productId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 lg:hidden transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="border-t border-border bg-background/80 backdrop-blur-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{productName}</p>
            {price !== null && (
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(price, currency)}
              </p>
            )}
          </div>
          <Button
            className="h-12 shrink-0 px-6 text-base font-semibold"
            size="lg"
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? "Adding..." : added ? "Added" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import type { StorefrontCartItem } from "@stadian/storefront-sdk";
import { useCart } from "@/providers/cart-provider";
import { cartQuantityLimits } from "@/lib/cart-quantity";

export function useCartItemActions(item: StorefrontCartItem) {
  const { updateItem, removeItem } = useCart();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { min, max, atMax } = cartQuantityLimits(item);

  async function run(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch {
      setError("We couldn’t confirm this update. Refresh your cart and try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return {
    busy, error, atMax,
    limitMessage: max !== null && item.quantity >= max
      ? item.quantity > max
        ? `Only ${max} can be ordered. Reduce the quantity or remove this item.`
        : `Maximum available for this order: ${max}.`
      : null,
    decrease: () => run(() => item.quantity <= min
      ? removeItem(item.id) : updateItem(item.id, item.quantity - 1)),
    increase: () => atMax ? Promise.resolve() : run(() => updateItem(item.id, item.quantity + 1)),
    remove: () => run(() => removeItem(item.id)),
  };
}

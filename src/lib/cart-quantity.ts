import type { StorefrontCartItem } from "@stadian/storefront-sdk";

export function cartQuantityLimits(item: Pick<StorefrontCartItem,
  "quantity" | "available_quantity" | "min_order_quantity" | "max_order_quantity"
>) {
  const min = Math.max(1, item.min_order_quantity ?? 1);
  const caps = [item.available_quantity, item.max_order_quantity].filter(
    (value): value is number => typeof value === "number",
  );
  const max = caps.length ? Math.max(0, Math.min(...caps)) : null;
  return { min, max, atMax: max !== null && item.quantity >= max };
}

import { describe, expect, it } from "vitest";
import { cartQuantityLimits } from "./cart-quantity";

describe("cart quantity limits", () => {
  it("caps a cart at sellable stock and handles an existing overstock cart", () => {
    expect(cartQuantityLimits({ quantity: 9, available_quantity: 9 })).toEqual({ min: 1, max: 9, atMax: true });
    expect(cartQuantityLimits({ quantity: 10, available_quantity: 9 }).atMax).toBe(true);
    expect(cartQuantityLimits({ quantity: 1, available_quantity: 0 }).max).toBe(0);
  });
  it("uses the tighter order maximum and respects the merchant minimum", () => {
    expect(cartQuantityLimits({ quantity: 4, available_quantity: 9, min_order_quantity: 2, max_order_quantity: 4 }))
      .toEqual({ min: 2, max: 4, atMax: true });
  });
  it("leaves untracked products uncapped and allows quantities below the limit", () => {
    expect(cartQuantityLimits({ quantity: 100, available_quantity: null })).toEqual({ min: 1, max: null, atMax: false });
    expect(cartQuantityLimits({ quantity: 8, available_quantity: 9 }).atMax).toBe(false);
  });
});

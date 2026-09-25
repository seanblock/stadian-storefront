import { describe, expect, it } from "vitest";
import { freeShippingLabel } from "./free-shipping";

describe("freeShippingLabel", () => {
  it("formats whole-dollar and cents thresholds like the API token", () => {
    expect(freeShippingLabel(400)).toBe("Free shipping on orders $400+");
    expect(freeShippingLabel(299.99)).toBe("Free shipping on orders $299.99+");
    expect(freeShippingLabel(1500)).toBe("Free shipping on orders $1,500+");
  });

  it("returns null when nothing ships free", () => {
    expect(freeShippingLabel(null)).toBeNull();
    expect(freeShippingLabel(undefined)).toBeNull();
    expect(freeShippingLabel(Number.NaN)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { minimumOrderMessage, minimumOrderShortfall } from "./minimum-order";

describe("minimumOrderShortfall", () => {
  it("is null when the store has no minimum", () => {
    expect(minimumOrderShortfall(10, null)).toBeNull();
    expect(minimumOrderShortfall(10, undefined)).toBeNull();
    expect(minimumOrderShortfall(10, 0)).toBeNull();
  });

  it("is the amount still needed below the minimum", () => {
    expect(minimumOrderShortfall(200, 300)).toBe(100);
    expect(minimumOrderShortfall(299.99, 300)).toBe(0.01);
    expect(minimumOrderShortfall(null, 300)).toBe(300);
  });

  it("is null at or above the minimum, without float drift", () => {
    expect(minimumOrderShortfall(300, 300)).toBeNull();
    expect(minimumOrderShortfall(0.1 + 0.2, 0.3)).toBeNull();
    expect(minimumOrderShortfall(450, 300)).toBeNull();
  });
});

describe("minimumOrderMessage", () => {
  it("states the minimum and what is left to add", () => {
    expect(minimumOrderMessage(260, 300)).toBe(
      "The minimum order is $300 before shipping and tax. Add $40 more to check out.",
    );
    expect(minimumOrderMessage(100, 299.5)).toContain("Add $199.50 more");
  });

  it("is null when the cart qualifies", () => {
    expect(minimumOrderMessage(300, 300)).toBeNull();
  });
});

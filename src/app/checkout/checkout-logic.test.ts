import { describe, it, expect } from "vitest";
import { resolveCheckoutResult, buildOrderPayload, formatCheckoutError } from "./checkout-logic";

describe("resolveCheckoutResult", () => {
  it("returns failed when payment_status is failed, with the error message", () => {
    const r = resolveCheckoutResult(
      { id: "o1", payment_status: "failed", payment_error: "Card declined" }, "embedded");
    expect(r).toEqual({ kind: "failed", message: "Card declined" });
  });
  it("returns failed with a generic message when no payment_error", () => {
    const r = resolveCheckoutResult({ id: "o1", payment_status: "failed" }, "embedded");
    expect(r.kind).toBe("failed");
    expect((r as { message: string }).message).toMatch(/payment/i);
  });
  it("returns redirect when redirect_url present and flow is redirect", () => {
    const r = resolveCheckoutResult(
      { id: "o1", payment_status: "pending", redirect_url: "https://pay.example/x" }, "redirect");
    expect(r).toEqual({ kind: "redirect", url: "https://pay.example/x" });
  });
  it("returns success otherwise", () => {
    const r = resolveCheckoutResult({ id: "o1", payment_status: "success" }, "embedded");
    expect(r).toEqual({ kind: "success", orderId: "o1" });
  });
});

describe("buildOrderPayload", () => {
  const shipping = { line1: "1 A St", city: "Austin", state: "TX", zip: "78701", country: "US" };
  it("omits billingAddress when sameAsShipping", () => {
    const p = buildOrderPayload({
      email: "a@b.com", shipping, sameAsShipping: true, billing: undefined,
      shippingMethodId: "m1", customerToken: undefined, notes: undefined, paymentData: {},
    });
    expect(p.billingAddress).toBeUndefined();
    expect(p.shippingMethodId).toBe("m1");
    expect(p.customerEmail).toBe("a@b.com");
  });
  it("includes billingAddress + customerToken when provided", () => {
    const billing = { line1: "2 B St", city: "Reno", state: "NV", zip: "89501", country: "US" };
    const p = buildOrderPayload({
      email: "a@b.com", shipping, sameAsShipping: false, billing,
      shippingMethodId: undefined, customerToken: "jwt123", notes: "hi", paymentData: { paymentFlow: "redirect" },
    });
    expect(p.billingAddress).toEqual(billing);
    expect(p.customerToken).toBe("jwt123");
    expect(p.paymentFlow).toBe("redirect");
  });
});

describe("formatCheckoutError", () => {
  it("says 'sold out' and 'remove' when nothing is available", () => {
    const msg = formatCheckoutError({
      code: "INSUFFICIENT_STOCK",
      message: "Not enough stock for 'MOTS-c 50mg': need 1, only 0 available",
      details: { product_name: "MOTS-c 50mg", requested: 1, available: 0 },
    });
    expect(msg).toContain("MOTS-c 50mg");
    expect(msg).toMatch(/sold out/i);
    expect(msg).toMatch(/remove it/i);
    expect(msg).not.toMatch(/only 0 available/);
  });
  it("says how many are left and to lower the quantity when some remain", () => {
    const msg = formatCheckoutError({
      code: "INSUFFICIENT_STOCK",
      message: "x",
      details: { product_name: "BPC-157", requested: 5, available: 2 },
    });
    expect(msg).toBe(
      "Only 2 of BPC-157 are left in stock. Please lower the quantity in your cart to continue.",
    );
  });
  it("uses singular 'is' when exactly one is left", () => {
    const msg = formatCheckoutError({
      code: "INSUFFICIENT_STOCK",
      message: "x",
      details: { product_name: "BPC-157", requested: 5, available: 1 },
    });
    expect(msg).toContain("Only 1 of BPC-157 is left");
  });
  it("falls back to generic stock copy when details are missing", () => {
    const msg = formatCheckoutError({
      code: "INSUFFICIENT_STOCK",
      message: "Not enough stock",
    });
    expect(msg).toMatch(/no longer available/i);
    expect(msg).toMatch(/review your cart/i);
  });
  it("passes through the API message for non-stock errors", () => {
    const msg = formatCheckoutError({ code: "COMPLIANCE_BLOCK", message: "Cannot ship to your state." });
    expect(msg).toBe("Cannot ship to your state.");
  });
  it("uses a generic fallback when a non-stock error has no message", () => {
    const msg = formatCheckoutError({ code: "UNKNOWN" });
    expect(msg).toMatch(/couldn't place your order/i);
  });
  it("surfaces the specific block reasons for a compliance VALIDATION_ERROR", () => {
    const msg = formatCheckoutError({
      code: "VALIDATION_ERROR",
      message: "Checkout blocked by compliance requirements",
      details: {
        blocks: [
          {
            product_id: "p1",
            block_type: "shipping_restricted",
            message: "BPC-157 cannot be shipped to CA.",
            resolution: "Remove it or use a different shipping address.",
          },
        ],
      },
    });
    expect(msg).toContain("BPC-157 cannot be shipped to CA.");
    expect(msg).toContain("Remove it or use a different shipping address.");
    expect(msg).not.toBe("Checkout blocked by compliance requirements");
  });
  it("joins multiple compliance blocks into one message", () => {
    const msg = formatCheckoutError({
      code: "VALIDATION_ERROR",
      message: "Checkout blocked by compliance requirements",
      details: {
        blocks: [
          { block_type: "disclaimer_required", message: "Accept the RUO disclaimer.", resolution: "" },
          { block_type: "shipping_not_configured", message: "No shipping methods are configured.", resolution: "" },
        ],
      },
    });
    expect(msg).toContain("Accept the RUO disclaimer.");
    expect(msg).toContain("No shipping methods are configured.");
  });
  it("falls back to the generic message when VALIDATION_ERROR has no blocks", () => {
    const msg = formatCheckoutError({
      code: "VALIDATION_ERROR",
      message: "Checkout blocked by compliance requirements",
    });
    expect(msg).toBe("Checkout blocked by compliance requirements");
  });
});

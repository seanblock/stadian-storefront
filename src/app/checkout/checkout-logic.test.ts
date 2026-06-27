import { describe, it, expect } from "vitest";
import { resolveCheckoutResult, buildOrderPayload } from "./checkout-logic";

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

import { describe, expect, it } from "vitest";
import { orderPaymentState } from "./order-payment-state";

describe("order payment wording", () => {
  it("shows money due even when the payment method is missing", () => {
    expect(orderPaymentState({ status: "pending_payment" })).toEqual({
      paid: false, awaitingPayment: true, totalLabel: "Total due",
    });
  });
  it.each(["paid", "success"])("recognizes an explicit %s settlement", (payment_status) => {
    expect(orderPaymentState({ status: "processing", payment_status }).totalLabel).toBe("Total paid");
  });
  it("lets successful settlement override a lagging pending order status", () => {
    expect(orderPaymentState({ status: "pending_payment", payment_status: "success" }).awaitingPayment).toBe(false);
  });
  it.each(["processing", "cancelled", "refunded"])("does not invent payment for %s", (status) => {
    expect(orderPaymentState({ status }).totalLabel).toBe("Order total");
  });
});

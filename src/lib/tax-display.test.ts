import { describe, expect, it } from "vitest";
import type { CheckoutQuote } from "@stadian/storefront-sdk";
import { cartTaxDisplay, cartTotalWithTax, orderTaxLabel, shouldQuote, summaryTotal } from "./tax-display";

const quote: CheckoutQuote = {
  subtotal: 100, discount_amount: 0, shipping_amount: 10, shipping_discount: 0, tax_amount: 9.76, total: 119.76,
  tax_pending: false, tax_status: "taxed", tax_label: "NY sales tax — New York City 8.875%", tax_rate: 0.08875,
  tax_jurisdiction: "New York City",
};

describe("tax display", () => {
  it("flat-rate carts keep their own tax and total", () => {
    const cart = { tax_amount: 8.25, tax_pending: false, total: 108.25, free_shipping: false };
    expect(cartTaxDisplay(cart, quote)).toEqual({ label: "Tax", amount: 8.25 });
    expect(summaryTotal(cart, 10, quote)).toBe(118.25);
    expect(shouldQuote(cart, "NY")).toBe(false);
  });

  it("destination carts show 'calculated at checkout' until quoted", () => {
    const cart = { tax_amount: 0, tax_pending: true, total: 100, free_shipping: false };
    expect(cartTaxDisplay(cart)).toEqual({ label: "Tax", amount: null });
    expect(cartTaxDisplay(cart, { ...quote, tax_pending: true })).toEqual({ label: "Tax", amount: null });
    expect(cartTaxDisplay(cart, quote)).toEqual({ label: quote.tax_label, amount: 9.76 });
    expect(summaryTotal(cart, 10, quote)).toBe(119.76);
    expect(summaryTotal(cart, 10, null)).toBe(110);
    expect(shouldQuote(cart, "NY")).toBe(true);
    expect(shouldQuote(cart, "")).toBe(false);
    expect(cartTotalWithTax(cart, quote)).toBe(109.76);
    expect(cartTotalWithTax(cart, null)).toBe(100);
  });

  it("receipts name the jurisdiction or the exemption", () => {
    expect(orderTaxLabel({ tax_status: "exempt", tax_label: "Tax exempt (resale certificate on file)" })).toBe(
      "Tax exempt (resale certificate on file)",
    );
    expect(orderTaxLabel({ tax_status: "flat", tax_label: "Tax 8.25%" })).toBe("Tax");
    expect(orderTaxLabel({})).toBe("Tax");
  });
});

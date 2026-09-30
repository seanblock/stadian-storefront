import type { CheckoutQuote, StorefrontCart, StorefrontTaxStatus } from "@stadian/storefront-sdk";

/** What the summary's tax line should say. `amount: null` = not known yet. */
export interface TaxDisplay {
  label: string;
  amount: number | null;
}

/**
 * Stores that tax by ship-to address return a cart with `tax_pending` and no
 * tax; the checkout quote (address + shipping method) fills it in. Flat-rate
 * stores keep the cart's own figure, exactly as before.
 */
export function cartTaxDisplay(
  cart: Pick<StorefrontCart, "tax_amount" | "tax_pending">,
  quote?: CheckoutQuote | null,
): TaxDisplay {
  if (!cart.tax_pending) return { label: "Tax", amount: cart.tax_amount };
  if (quote && !quote.tax_pending) return { label: quote.tax_label || "Tax", amount: quote.tax_amount };
  return { label: "Tax", amount: null };
}

/** Summary total: the quote's (tax + net shipping included) when we have one,
 *  else the cart total plus the chosen shipping. */
export function summaryTotal(
  cart: Pick<StorefrontCart, "total" | "tax_pending" | "free_shipping">,
  shippingCost: number | undefined,
  quote?: CheckoutQuote | null,
): number {
  if (cart.tax_pending && quote && !quote.tax_pending) return quote.total;
  return cart.total + (cart.free_shipping ? 0 : shippingCost ?? 0);
}

/** Receipt tax line label for a placed order. Flat-rate and older orders read
 *  "Tax"; destination-taxed ones name the jurisdiction or the exemption. */
export function orderTaxLabel(order: { tax_status?: StorefrontTaxStatus | null; tax_label?: string | null }): string {
  if (!order.tax_status || order.tax_status === "flat") return "Tax";
  return order.tax_label || "Tax";
}

/** Only destination stores need a quote round-trip; and only once a state is known. */
export function shouldQuote(cart: Pick<StorefrontCart, "tax_pending"> | null | undefined, state: string | undefined): boolean {
  return !!cart?.tax_pending && !!state && state.trim().length >= 2;
}

/** Rep rail total (merchandise after discounts, shipping shown separately)
 *  plus destination tax once quoted. */
export function cartTotalWithTax(
  cart: Pick<StorefrontCart, "total" | "tax_pending">,
  quote?: CheckoutQuote | null,
): number {
  return cart.tax_pending && quote && !quote.tax_pending ? cart.total + quote.tax_amount : cart.total;
}

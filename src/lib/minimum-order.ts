/**
 * The store's minimum order (`branding.minimum_order_amount`), checked against
 * the cart subtotal before shipping and tax — the same figure the API enforces
 * at checkout (error code BELOW_MINIMUM_ORDER). The UI uses this only to warn
 * early and disable checkout buttons; the API is the real gate.
 */

/** Dollars still needed to reach the minimum, or null when the cart qualifies. */
export function minimumOrderShortfall(
  subtotal: number | null | undefined,
  minimum: number | null | undefined,
): number | null {
  if (minimum == null || !Number.isFinite(minimum) || minimum <= 0) return null;
  const cents = Math.round(minimum * 100) - Math.round((subtotal ?? 0) * 100);
  return cents > 0 ? cents / 100 : null;
}

function money(amount: number): string {
  return Number.isInteger(amount)
    ? `$${amount.toLocaleString("en-US")}`
    : `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "The minimum order is $300. Add $40 more to check out." or null. */
export function minimumOrderMessage(
  subtotal: number | null | undefined,
  minimum: number | null | undefined,
): string | null {
  const shortfall = minimumOrderShortfall(subtotal, minimum);
  if (shortfall == null || minimum == null) return null;
  return `The minimum order is ${money(minimum)} before shipping and tax. Add ${money(shortfall)} more to check out.`;
}

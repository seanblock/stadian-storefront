/**
 * "Free shipping on orders $400+" copy, derived from the store's real rule
 * (`branding.free_shipping_threshold` — the lowest threshold on an active
 * shipping method). Returns null when nothing ships free, so no surface can
 * advertise free shipping checkout won't honor. Formatting matches the API's
 * trust-signal `{free_shipping_threshold}` token: $400, $299.99.
 */
export function freeShippingLabel(threshold: number | null | undefined): string | null {
  if (threshold == null || !Number.isFinite(threshold) || threshold < 0) return null;
  const amount = Number.isInteger(threshold)
    ? `$${threshold.toLocaleString("en-US")}`
    : `$${threshold.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `Free shipping on orders ${amount}+`;
}

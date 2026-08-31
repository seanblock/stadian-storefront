/**
 * Shared presentation helpers for offline (manual) payment methods — used by
 * both the checkout picker and the order confirmation page, which have to
 * label the same fields identically.
 */

/**
 * Human label for a manual-payment detail field. The API returns config field
 * names (`ach_routing_number`, `zelle_email`), which are method-prefixed; the
 * method is already the heading, so the prefix is dropped and the rest
 * title-cased. Explicit entries cover the cases where that reads badly.
 */
const MANUAL_FIELD_LABELS: Record<string, string> = {
  cashapp_cashtag: "$Cashtag",
  venmo_handle: "Venmo Handle",
  zelle_email: "Zelle Email",
  check_payable_to: "Make Check Payable To",
  check_mailing_address: "Mail To",
};

export function manualFieldLabel(field: string): string {
  const explicit = MANUAL_FIELD_LABELS[field];
  if (explicit) return explicit;
  return field
    .replace(/^(ach|wire|zelle|venmo|cashapp|check)_/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

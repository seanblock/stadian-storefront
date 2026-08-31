import type { Address } from "@/app/checkout/checkout-logic";
import type { PaymentClientConfig } from "@/app/actions/payments";

/**
 * Two steps, not four. Customer selection is not a step — a POS lets the
 * operator start ringing items immediately and bind the account whenever it
 * comes up. Shipping and payment are not separate steps either: they are one
 * decision made at the counter, and splitting them cost a round trip whenever
 * an address needed a fix after the card was chosen.
 */
export type SaleStep = "build" | "checkout" | "done";

export const SALE_STEPS: SaleStep[] = ["build", "checkout"];

export type SaleAddressErrors = Record<string, string | undefined>;

export function validateSaleAddress(address: Address): SaleAddressErrors {
  const errors: SaleAddressErrors = {};
  if (!address.line1.trim()) errors.line1 = "Street address is required";
  if (!address.city.trim()) errors.city = "City is required";
  if (!address.state.trim()) errors.state = "State is required";
  if (!address.zip.trim()) errors.zip = "ZIP is required";
  if (!address.country.trim()) errors.country = "Country is required";
  return errors;
}

export function isAddressComplete(address: Address): boolean {
  return Object.keys(validateSaleAddress(address)).length === 0;
}

/** Which POS payment modes the store's gateway supports. Invoice always works. */
export function availableModes(config: PaymentClientConfig | null): {
  card: boolean;
  link: boolean;
  invoice: boolean;
} {
  const enabled = config?.gateway_enabled === true;
  return {
    card: enabled && config?.checkout_mode === "embedded",
    link: enabled && config?.checkout_mode === "redirect",
    invoice: true,
  };
}

export type PaymentModeAvailability = {
  available: boolean;
  /** Why it can't be used — null while the gateway config is still loading. */
  reason: string | null;
};

/**
 * Whether each POS payment tile can be used, and why not.
 *
 * Every unusable mode must be reported here, not just pay-by-link. A tile that
 * looks selectable on a store with no gateway lets a rep pick it and then find
 * the charge button dead, which is the worst version of this screen.
 */
export function paymentModeAvailability(
  modes: { card: boolean; link: boolean; invoice: boolean },
  loading: boolean
): Record<"card" | "link" | "invoice", PaymentModeAvailability> {
  const gate = (ok: boolean, reason: string): PaymentModeAvailability =>
    ok
      ? { available: true, reason: null }
      : { available: false, reason: loading ? null : reason };

  return {
    card: gate(modes.card, "Card entry isn't set up for this store."),
    link: gate(modes.link, "This store's gateway can't issue payment links."),
    // Invoice needs no gateway, so it is always offered.
    invoice: { available: true, reason: null },
  };
}

/** The only usable mode, when there is exactly one — worth preselecting. */
export function soleAvailableMode(
  availability: Record<"card" | "link" | "invoice", PaymentModeAvailability>
): "card" | "link" | "invoice" | null {
  const usable = (["card", "link", "invoice"] as const).filter(
    (m) => availability[m].available
  );
  return usable.length === 1 ? usable[0] : null;
}

/** Ship-to payload: the address plus the customer's name/contact, which the
 *  backend stores verbatim on the order (and shipping labels read). */
export function buildShipTo(
  address: Address,
  customer: { name: string | null; email: string; phone: string | null }
): Record<string, unknown> {
  const parts = (customer.name ?? "").split(" ");
  return {
    ...address,
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" "),
    email: customer.email,
    ...(customer.phone ? { phone: customer.phone } : {}),
  };
}

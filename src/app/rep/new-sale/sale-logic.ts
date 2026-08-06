import type { Address } from "@/app/checkout/checkout-logic";
import type { PaymentClientConfig } from "@/app/actions/payments";

export type SaleStep = "customer" | "cart" | "shipping" | "payment" | "done";

export const SALE_STEPS: SaleStep[] = ["customer", "cart", "shipping", "payment"];

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

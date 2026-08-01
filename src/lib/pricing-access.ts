import type { StorefrontBranding, StorefrontRegistrationMode } from "@stadian/storefront-sdk";
import { getBranding } from "./branding";
import { getCustomerToken } from "./customer-token";

type AccessBranding = Pick<
  StorefrontBranding,
  "hide_prices_until_login" | "require_login_to_checkout" | "registration_mode"
>;

/** Pure rule: may this visitor see prices? */
export function pricesHiddenFor(
  branding: AccessBranding,
  isSignedIn: boolean
): boolean {
  return branding.hide_prices_until_login === true && !isSignedIn;
}

/** Pure rule: what shape should the sign-up flow take? */
export function registrationShapeFor(branding: AccessBranding): {
  mode: StorefrontRegistrationMode;
  /** No public sign-up at all. */
  inviteOnly: boolean;
  /** Accounts are created pending and reviewed by hand. */
  requiresApproval: boolean;
  /**
   * Sign-ups are companies, so the form collects business details. A store that
   * gates pricing or vets applicants is selling wholesale.
   */
  isWholesale: boolean;
} {
  const mode = branding.registration_mode ?? "open";
  return {
    mode,
    inviteOnly: mode === "invite_only",
    requiresApproval: mode === "approval",
    isWholesale: mode === "approval" || branding.hide_prices_until_login === true,
  };
}

/**
 * True when this visitor must not see prices — a wholesale store with
 * `hide_prices_until_login` on and nobody signed in.
 *
 * The API already withholds the numbers; this only decides what the UI says in
 * their place ("Sign in to see pricing" rather than "Contact for pricing").
 */
export async function arePricesHidden(): Promise<boolean> {
  const [branding, token] = await Promise.all([getBranding(), getCustomerToken()]);
  return pricesHiddenFor(branding, Boolean(token));
}

/** True when guests may not check out on this store. */
export async function isCheckoutLoginRequired(): Promise<boolean> {
  const branding = await getBranding();
  return branding.require_login_to_checkout === true;
}

/** Sign-up flow shape for the current store. */
export async function getRegistrationShape() {
  return registrationShapeFor(await getBranding());
}

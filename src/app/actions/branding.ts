"use server";

import type { StorefrontTrustSignal } from "@stadian/storefront-sdk";
import { getBranding } from "@/lib/branding";

/**
 * The tenant's own Turnstile site key, or null when they haven't configured
 * bot protection.
 *
 * Fetched here rather than passed down as a prop because the login and checkout
 * pages are client components: this keeps <Turnstile> self-contained at every
 * call site. The key is public by design — the secret half lives encrypted in
 * the merchant's tenant config and never leaves the API.
 */
export async function getTurnstileSiteKey(): Promise<string | null> {
  const branding = await getBranding();
  return branding.turnstile_site_key ?? null;
}

/** Tenant-configured store-wide trust signals (for the checkout trust row). */
export async function getTrustSignals(): Promise<StorefrontTrustSignal[]> {
  const branding = await getBranding();
  return branding.trust_signals ?? [];
}

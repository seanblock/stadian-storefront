"use server";

import type { StorefrontTrustSignal } from "@stadian/storefront-sdk";
import { getBranding } from "@/lib/branding";

/** Tenant-configured store-wide trust signals (for the checkout trust row). */
export async function getTrustSignals(): Promise<StorefrontTrustSignal[]> {
  const branding = await getBranding();
  return branding.trust_signals ?? [];
}

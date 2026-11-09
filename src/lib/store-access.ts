import { cookies } from "next/headers";
import type { StorefrontBranding } from "@stadian/storefront-sdk";
import { getBrandingState } from "./branding";
import { AGE_CONFIRMED_COOKIE } from "./age-gate-cookie";
import { PREVIEW_COOKIE, verifyPreviewToken } from "./preview-access";

type AccessBranding = Pick<StorefrontBranding, "storefront_enabled" | "age_gate_enabled">;

export interface StoreAccess {
  /** The closed sign replaces every page. */
  isClosed: boolean;
  /** The age gate sits over the page until the visitor confirms. */
  ageGateActive: boolean;
  /** Branding couldn't be loaded, so nothing is known about gates or closure. */
  brandingUnavailable: boolean;
  /** Product data may be fetched and rendered for this visitor. */
  canViewCatalog: boolean;
}

/** Pure rule: what may this visitor see? */
export function storeAccessFor(
  branding: AccessBranding,
  visitor: { ageConfirmed: boolean; hasPreviewAccess: boolean },
  brandingIsFallback: boolean
): StoreAccess {
  const isClosed = branding.storefront_enabled === false && !visitor.hasPreviewAccess;
  const ageGateActive =
    !isClosed && branding.age_gate_enabled === true && !visitor.ageConfirmed;
  return {
    isClosed,
    ageGateActive,
    brandingUnavailable: brandingIsFallback,
    // Fails closed: fallback branding can't say whether a gate or closure applies.
    canViewCatalog: !brandingIsFallback && !isClosed && !ageGateActive,
  };
}

/**
 * Pure rule for surfaces with no visitor, such as the sitemap: may the catalog
 * be listed for anyone who asks?
 */
export function isCatalogPublic(branding: AccessBranding, brandingIsFallback: boolean): boolean {
  return storeAccessFor(
    branding,
    { ageConfirmed: false, hasPreviewAccess: false },
    brandingIsFallback
  ).canViewCatalog;
}

/**
 * The current visitor's access. Pages must check `canViewCatalog` BEFORE fetching
 * product data: anything a page fetches reaches the HTML payload even when the
 * layout doesn't render that page, so hiding it in the layout isn't enough.
 *
 * This keeps products out of page source and away from scanners. It isn't an
 * access control: the age cookie is self-asserted by clicking the gate.
 */
export async function getStoreAccess(): Promise<StoreAccess> {
  const [{ branding, isFallback }, cookieStore] = await Promise.all([
    getBrandingState(),
    cookies(),
  ]);
  return storeAccessFor(
    branding,
    {
      ageConfirmed: Boolean(cookieStore.get(AGE_CONFIRMED_COOKIE)),
      hasPreviewAccess: verifyPreviewToken(cookieStore.get(PREVIEW_COOKIE)?.value),
    },
    isFallback
  );
}

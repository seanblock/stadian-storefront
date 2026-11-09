import { unstable_cache } from "next/cache";
import { getStadianClient } from "./stadian";
import type { StorefrontBranding } from "@stadian/storefront-sdk";

const FALLBACK_BRANDING: StorefrontBranding = {
  store_name: "Store",
  tagline: "Wholesale supplements, handled with care",
  logo_url: null,
  primary_color: "#2563eb",
  accent_color: "#10b981",
  mode: "light",
  social_links: null,
  footer_text: null,
  about_us: null,
  faq: null,
  terms_of_service: null,
  privacy_policy: null,
  return_policy: null,
  storefront_enabled: true,
  storefront_closed_reason: null,
} as StorefrontBranding;

// Cache the RAW backend branding for a short window so admin changes (age gate,
// closed state, name, colors) propagate to a running/warm server within ~30s,
// instead of being pinned for the whole process lifetime. Env-based overrides
// are applied OUTSIDE this cache (see getBranding) so they never get pinned by
// the static cache key.
const fetchCachedBranding = unstable_cache(
  // Throws on failure so the failure isn't cached: the next request retries
  // rather than serving the fallback for the whole window.
  async (): Promise<StorefrontBranding> => getStadianClient().branding.get(),
  ["storefront-branding"],
  { revalidate: 30, tags: ["branding"] }
);

/** The tenant's branding, or null when the API couldn't be reached. */
async function fetchRawBranding(): Promise<StorefrontBranding | null> {
  try {
    return await fetchCachedBranding();
  } catch {
    return null;
  }
}

/**
 * Branding plus whether it's the fallback. The fallback knows nothing about the
 * tenant's gate or closed state, so access decisions must not trust it.
 */
export async function getBrandingState(): Promise<{
  branding: StorefrontBranding;
  isFallback: boolean;
}> {
  const raw = await fetchRawBranding();
  // Optional per-deployment overrides — useful for previewing brand changes
  // without touching the Stadian admin, and the e2e closed-state seam. Applied
  // per-request (outside the cache) so they always reflect the current env.
  return { branding: applyOverrides(raw ?? FALLBACK_BRANDING), isFallback: raw === null };
}

export async function getBranding(): Promise<StorefrontBranding> {
  return (await getBrandingState()).branding;
}

const CLOSED_REASONS = ["general", "coming_soon", "maintenance"] as const;

function applyOverrides(branding: StorefrontBranding): StorefrontBranding {
  let result = branding;
  const storeNameOverride = process.env.NEXT_PUBLIC_STORE_NAME;
  if (storeNameOverride) {
    result = { ...result, store_name: storeNameOverride };
  }
  // Ops/preview + test seam: force the closed state without touching the tenant.
  const closedOverride = process.env.STORE_CLOSED_OVERRIDE;
  if (closedOverride) {
    const reason = (CLOSED_REASONS as readonly string[]).includes(closedOverride)
      ? (closedOverride as StorefrontBranding["storefront_closed_reason"])
      : "general";
    result = { ...result, storefront_enabled: false, storefront_closed_reason: reason };
  }
  return result;
}

export function brandingToCssVars(
  branding: StorefrontBranding
): Record<string, string> {
  return {
    "--color-primary": branding.primary_color || "#2563eb",
    "--color-accent": branding.accent_color || "#10b981",
  };
}

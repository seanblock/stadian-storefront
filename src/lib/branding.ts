import { getStadianClient } from "./stadian";
import type { StorefrontBranding } from "@stadian/storefront-sdk";

let cachedBranding: StorefrontBranding | null = null;

export async function getBranding(): Promise<StorefrontBranding> {
  if (cachedBranding) return cachedBranding;
  try {
    const client = getStadianClient();
    const branding = await client.branding.get();
    // Optional per-deployment overrides — useful for previewing brand changes
    // without touching the Stadian admin.
    cachedBranding = applyOverrides(branding);
    return cachedBranding;
  } catch {
    return {
      store_name: "Store",
      tagline: null,
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
  }
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

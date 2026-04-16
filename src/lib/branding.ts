import { getStadianClient } from "./stadian";
import type { StorefrontBranding } from "@stadian/storefront-sdk";

let cachedBranding: StorefrontBranding | null = null;

export async function getBranding(): Promise<StorefrontBranding> {
  if (cachedBranding) return cachedBranding;
  try {
    const client = getStadianClient();
    cachedBranding = await client.branding.get();
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
    } as StorefrontBranding;
  }
}

export function brandingToCssVars(
  branding: StorefrontBranding
): Record<string, string> {
  return {
    "--color-primary": branding.primary_color || "#2563eb",
    "--color-accent": branding.accent_color || "#10b981",
  };
}

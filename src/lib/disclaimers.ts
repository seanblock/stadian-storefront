import { unstable_cache } from "next/cache";
import { getHttpClient } from "./stadian";

/**
 * Tenant-authored, versioned disclaimers (managed in the Stadian admin).
 *
 * The API keeps one active version per type; the storefront displays it and
 * records a customer's acceptance against it. Nothing here is wrapped by the
 * vendored SDK yet, so this module speaks to the raw endpoints through the
 * SDK's HttpClient.
 */

export type DisclaimerType =
  | "fda_supplement"
  | "age_verification"
  | "terms_of_service"
  | "privacy_policy";

export interface StorefrontDisclaimerVersion {
  id: string;
  disclaimer_type: DisclaimerType;
  version: number;
  title: string;
  content: string;
  created_at: string;
}

type ActiveDisclaimersResponse = {
  items: Partial<Record<DisclaimerType, StorefrontDisclaimerVersion>>;
};

// Same shape as the branding cache: a short window so an admin publishing a
// new version reaches a warm server within ~30s, and a null result on any
// failure so the caller can fall back rather than crash the page.
const fetchActiveDisclaimers = unstable_cache(
  async (): Promise<ActiveDisclaimersResponse["items"] | null> => {
    try {
      const data = await getHttpClient().request<ActiveDisclaimersResponse>(
        "GET",
        "/disclaimers/active",
      );
      return data.items ?? {};
    } catch {
      return null;
    }
  },
  ["storefront-disclaimers"],
  { revalidate: 30, tags: ["disclaimers"] },
);

/**
 * The active version of one disclaimer type, or null when the tenant has not
 * published one (or the API is unreachable — callers must have a fallback).
 */
export async function getActiveDisclaimer(
  type: DisclaimerType,
): Promise<StorefrontDisclaimerVersion | null> {
  const items = await fetchActiveDisclaimers();
  const version = items?.[type];
  return version && version.content ? version : null;
}

export interface DisclaimerAcceptance {
  id: string;
  disclaimer_type: DisclaimerType;
  disclaimer_version_id: string | null;
  content_hash: string | null;
  accepted_at: string;
}

/**
 * Record that the signed-in customer accepted a disclaimer. The API resolves
 * the active version itself and stores a content hash for tamper evidence.
 *
 * Requires a live customer access token — the endpoint is customer-scoped, so
 * a store-level API key alone is rejected.
 */
export async function recordDisclaimerAcceptance(
  type: DisclaimerType,
  accessToken: string,
  ipAddress?: string,
): Promise<DisclaimerAcceptance> {
  return getHttpClient().request<DisclaimerAcceptance>(
    "POST",
    "/disclaimers/accept",
    {
      body: { disclaimer_type: type, ip_address: ipAddress ?? null },
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
}

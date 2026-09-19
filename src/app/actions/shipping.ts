"use server";

import { getHttpClient } from "@/lib/stadian";
import { fetchWithOptionalAuth } from "@/lib/authed-fetch";
import type { ShippingOption } from "@stadian/storefront-sdk";

export async function getShippingOptions(
  sessionId: string,
): Promise<ShippingOption[]> {
  try {
    const result = await fetchWithOptionalAuth((customerToken) =>
      getHttpClient().request<{ options: ShippingOption[] }>("POST", "/shipping-estimate", {
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : undefined,
        body: { session_token: sessionId },
      }),
    );
    return result.options;
  } catch {
    return [];
  }
}

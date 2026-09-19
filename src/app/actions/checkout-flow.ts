"use server";

import { getHttpClient } from "@/lib/stadian";
import { fetchWithOptionalAuth } from "@/lib/authed-fetch";
import type { CheckoutFlowResponse } from "@stadian/storefront-sdk";

export async function getCheckoutFlow(
  sessionId: string,
  state: string,
): Promise<CheckoutFlowResponse | null> {
  try {
    return await fetchWithOptionalAuth((customerToken) =>
      getHttpClient().request<CheckoutFlowResponse>("POST", "/checkout/flow", {
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : undefined,
        body: { session_token: sessionId, shipping_state: state },
      }),
    );
  } catch {
    return null;
  }
}

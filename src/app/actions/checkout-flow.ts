"use server";

import { getStadianClient } from "@/lib/stadian";
import type { CheckoutFlowResponse } from "@stadian/storefront-sdk";

export async function getCheckoutFlow(
  sessionId: string,
  state: string,
): Promise<CheckoutFlowResponse | null> {
  try {
    return await getStadianClient().checkout.getFlow(sessionId, state);
  } catch {
    return null;
  }
}

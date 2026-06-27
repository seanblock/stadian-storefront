"use server";

import { getStadianClient } from "@/lib/stadian";
import type { ShippingOption } from "@stadian/storefront-sdk";

export async function getShippingOptions(
  sessionId: string,
): Promise<ShippingOption[]> {
  try {
    return (
      await getStadianClient().checkout.estimateShipping(sessionId)
    ).options;
  } catch {
    return [];
  }
}

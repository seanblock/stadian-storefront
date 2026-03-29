"use server";

import { getStadianClient } from "@/lib/stadian";
import type { StorefrontOrder } from "@stadian/storefront-sdk";

export async function createOrder(
  sessionId: string,
  data: {
    customerEmail: string;
    shippingAddress: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    paymentMethod?: string;
    notes?: string;
  }
): Promise<StorefrontOrder> {
  const client = getStadianClient();
  return client.checkout.create({
    sessionToken: sessionId,
    customerEmail: data.customerEmail,
    shippingAddress: data.shippingAddress,
    paymentMethod: data.paymentMethod || "pending",
    notes: data.notes,
  });
}

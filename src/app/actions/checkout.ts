"use server";

import { cookies } from "next/headers";
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
  const cookieStore = await cookies();
  const referralCode = cookieStore.get("stadian_ref")?.value;

  // Append referral code to notes if present
  let notes = data.notes || "";
  if (referralCode) {
    notes = notes
      ? `${notes}\n[Referral: ${referralCode}]`
      : `[Referral: ${referralCode}]`;
  }

  const client = getStadianClient();
  const order = await client.checkout.create({
    sessionToken: sessionId,
    customerEmail: data.customerEmail,
    shippingAddress: data.shippingAddress,
    paymentMethod: data.paymentMethod || "pending",
    notes: notes || undefined,
  });

  // Clear referral cookie after successful order
  if (referralCode) {
    cookieStore.delete("stadian_ref");
  }

  return order;
}

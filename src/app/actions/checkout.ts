"use server";

import { cookies } from "next/headers";
import { getStadianClient } from "@/lib/stadian";
import { getCustomerToken } from "@/app/actions/auth";
import type { StorefrontOrder } from "@stadian/storefront-sdk";
import type { Address } from "@/app/checkout/checkout-logic";

export async function createOrder(
  sessionId: string,
  data: {
    customerEmail: string;
    shippingAddress: Address;
    billingAddress?: Address;
    paymentMethod?: string;
    notes?: string;
    paymentToken?: string;
    paymentType?: "card" | "ach";
    paymentFlow?: "embedded" | "redirect";
    storedPaymentMethodId?: string;
    savePaymentMethod?: boolean;
    shippingMethodId?: string;
    customerToken?: string;
  }
): Promise<StorefrontOrder> {
  const cookieStore = await cookies();
  const referralCode = cookieStore.get("stadian_ref")?.value;

  let notes = data.notes || "";
  if (referralCode) {
    notes = notes
      ? `${notes}\n[Referral: ${referralCode}]`
      : `[Referral: ${referralCode}]`;
  }

  const hasPayment =
    data.paymentToken ||
    data.storedPaymentMethodId ||
    data.paymentFlow === "redirect";

  const customerToken = (await getCustomerToken()) ?? undefined;

  const client = getStadianClient();
  const order = await client.checkout.create({
    sessionToken: sessionId,
    customerEmail: data.customerEmail,
    shippingAddress: { ...data.shippingAddress },
    billingAddress: data.billingAddress ? { ...data.billingAddress } : undefined,
    paymentMethod: hasPayment ? undefined : data.paymentMethod || "pending",
    paymentToken: data.paymentToken,
    paymentType: data.paymentType,
    paymentFlow: data.paymentFlow,
    storedPaymentMethodId: data.storedPaymentMethodId,
    savePaymentMethod: data.savePaymentMethod,
    notes: notes || undefined,
    customerToken,
    shippingMethodId: data.shippingMethodId,
  });

  if (referralCode) {
    cookieStore.delete("stadian_ref");
  }

  return order;
}

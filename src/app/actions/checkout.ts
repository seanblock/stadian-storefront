"use server";

import { cookies } from "next/headers";
import { getStadianClient } from "@/lib/stadian";
import { getCustomerToken } from "@/app/actions/auth";
import { StadianError, type StorefrontOrder } from "@stadian/storefront-sdk";
import type { Address } from "@/app/checkout/checkout-logic";

/**
 * Result of a checkout attempt. Expected failures (e.g. a sold-out item) are
 * returned as a serializable object rather than thrown, because thrown errors
 * from a server action lose their custom fields (code/status) crossing back to
 * the client.
 */
export type CreateOrderResult =
  | { ok: true; order: StorefrontOrder }
  | { ok: false; code: string; message: string; status: number };

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
): Promise<CreateOrderResult> {
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
  try {
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

    return { ok: true, order };
  } catch (err) {
    // Surface expected API errors (sold-out stock, compliance, etc.) as data so the
    // client can render a specific message. Unknown errors get a generic fallback.
    if (err instanceof StadianError) {
      return { ok: false, code: err.code, message: err.message, status: err.status };
    }
    return {
      ok: false,
      code: "UNKNOWN",
      message: err instanceof Error ? err.message : "Failed to place order.",
      status: 0,
    };
  }
}

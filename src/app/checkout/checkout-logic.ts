import type { PaymentData } from "@/components/checkout/payment-section";

export interface Address {
  line1: string; line2?: string; city: string; state: string; zip: string; country: string;
}

interface OrderResultInput {
  id: string;
  payment_status?: string | null;
  payment_error?: string | null;
  redirect_url?: string | null;
}

export type CheckoutResult =
  | { kind: "redirect"; url: string }
  | { kind: "failed"; message: string }
  | { kind: "success"; orderId: string };

export function resolveCheckoutResult(
  order: OrderResultInput,
  paymentFlow: PaymentData["paymentFlow"],
): CheckoutResult {
  if (order.payment_status === "failed") {
    return { kind: "failed", message: order.payment_error || "Your payment could not be processed. Please try again." };
  }
  if (paymentFlow === "redirect" && order.redirect_url) {
    return { kind: "redirect", url: order.redirect_url };
  }
  return { kind: "success", orderId: order.id };
}

export interface BuildPayloadInput {
  email: string;
  shipping: Address;
  sameAsShipping: boolean;
  billing: Address | undefined;
  shippingMethodId: string | undefined;
  customerToken: string | undefined;
  notes: string | undefined;
  paymentData: PaymentData;
}

export function buildOrderPayload(input: BuildPayloadInput) {
  return {
    customerEmail: input.email,
    shippingAddress: input.shipping,
    billingAddress: input.sameAsShipping ? undefined : input.billing,
    shippingMethodId: input.shippingMethodId,
    customerToken: input.customerToken,
    notes: input.notes || undefined,
    ...input.paymentData,
  };
}

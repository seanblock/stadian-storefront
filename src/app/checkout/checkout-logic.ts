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

/**
 * Turn a failed checkout result into friendly, customer-facing copy. Stock
 * problems get specific guidance (remove vs. reduce) built from the API's
 * structured `details`, falling back to plain language when those fields are
 * absent.
 */
export function formatCheckoutError(result: {
  code: string;
  message?: string;
  details?: Record<string, unknown>;
}): string {
  if (result.code === "VALIDATION_ERROR" && Array.isArray(result.details?.blocks)) {
    const reasons = (result.details.blocks as Array<Record<string, unknown>>)
      .map((b) => {
        const message = typeof b.message === "string" ? b.message : undefined;
        const resolution = typeof b.resolution === "string" ? b.resolution : undefined;
        return [message, resolution].filter(Boolean).join(" ");
      })
      .filter(Boolean);

    if (reasons.length > 0) {
      return reasons.join(" ");
    }
  }

  if (result.code === "INSUFFICIENT_STOCK") {
    const name =
      typeof result.details?.product_name === "string"
        ? result.details.product_name
        : undefined;
    const available =
      typeof result.details?.available === "number"
        ? result.details.available
        : undefined;

    if (name && available !== undefined) {
      if (available <= 0) {
        return `${name} is sold out and no longer available. Please remove it from your cart to continue.`;
      }
      const unit = available === 1 ? "is" : "are";
      return `Only ${available} of ${name} ${unit} left in stock. Please lower the quantity in your cart to continue.`;
    }

    return "Some items in your cart are no longer available in the quantity you requested. Please review your cart before checking out.";
  }

  return result.message || "We couldn't place your order. Please try again.";
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
  /** Buyer ticked the age confirmation. Recorded server-side before the
   *  compliance guard runs. */
  ageVerificationAccepted?: boolean;
}

export function buildOrderPayload(input: BuildPayloadInput) {
  return {
    ageVerificationAccepted: input.ageVerificationAccepted,
    customerEmail: input.email,
    shippingAddress: input.shipping,
    billingAddress: input.sameAsShipping ? undefined : input.billing,
    shippingMethodId: input.shippingMethodId,
    customerToken: input.customerToken,
    notes: input.notes || undefined,
    ...input.paymentData,
  };
}

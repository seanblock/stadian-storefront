"use server";

import { getProductCoas, type ProductCoa } from "@/lib/product-coas";

import { getStadianClient } from "@/lib/stadian";
import { getValidCustomerToken } from "@/lib/customer-token";
import {
  StadianError,
  type RepCheckoutResponse,
  type RepCustomer,
  type RepCustomersResponse,
  type RepDashboard,
  type RepOrderSummary,
  type RepOrdersResponse,
  type StorefrontCommission,
  type StorefrontPayout,
} from "@stadian/storefront-sdk";
import type { Address } from "@/app/checkout/checkout-logic";

/**
 * Sales-rep server actions. All follow the storefront action rule: expected
 * failures come back as data (Next.js masks thrown server-action errors in
 * production), so every result is a discriminated union on `ok`.
 */
export type RepResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; status: number; details?: Record<string, unknown> };

export async function getRepCommissions(): Promise<RepResult<{ items: StorefrontCommission[] }>> {
  return withRepAuth((customerToken) => getStadianClient().customers.commissions({ customerToken, limit: 50 }));
}

export async function getRepPayouts(): Promise<RepResult<{ items: StorefrontPayout[] }>> {
  return withRepAuth((customerToken) => getStadianClient().customers.payouts({ customerToken, limit: 50 }));
}

async function withRepAuth<T>(
  fn: (customerToken: string) => Promise<T>
): Promise<RepResult<T>> {
  const customerToken = await getValidCustomerToken();
  if (!customerToken) {
    return { ok: false, code: "UNAUTHORIZED", message: "Session expired — sign in again.", status: 401 };
  }
  try {
    return { ok: true, data: await fn(customerToken) };
  } catch (err) {
    if (err instanceof StadianError) {
      const message = err.status === 0 || err.status >= 500
        ? "The store is temporarily unavailable. Please try again shortly."
        : err.message;
      return { ok: false, code: err.code, message, status: err.status, details: err.details };
    }
    return {
      ok: false,
      code: "UNKNOWN",
      message: "The store is temporarily unavailable. Please try again shortly.",
      status: 0,
    };
  }
}

export async function searchRepCustomers(params: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<RepResult<RepCustomersResponse>> {
  return withRepAuth((customerToken) =>
    getStadianClient().rep.searchCustomers({ customerToken, ...params })
  );
}

export async function getRepCustomer(
  customerId: string
): Promise<RepResult<RepCustomer>> {
  return withRepAuth((customerToken) =>
    getStadianClient().rep.getCustomer({ customerToken, customerId })
  );
}

export async function createRepCustomer(params: {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  customerType?: "individual" | "business";
  companyName?: string;
  sendInvite?: boolean;
}): Promise<RepResult<RepCustomer>> {
  return withRepAuth((customerToken) =>
    getStadianClient().rep.createCustomer({ customerToken, ...params })
  );
}

export async function bindRepCart(params: {
  sessionToken: string;
  customerId: string;
}): Promise<RepResult<{ ok: boolean; customer_id: string }>> {
  return withRepAuth((customerToken) =>
    getStadianClient().rep.bindCart({ customerToken, ...params })
  );
}

export async function createRepOrder(params: {
  sessionToken: string;
  customerId: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingMethodId?: string;
  notes?: string;
  /** "card" | "link" | "invoice" — the POS payment mode. */
  mode: "card" | "link" | "invoice";
  paymentToken?: string;
  paymentType?: "card" | "ach";
  sendPaymentLinkEmail?: boolean;
  acceptDisclaimers?: boolean;
}): Promise<RepResult<RepCheckoutResponse>> {
  const result = await withRepAuth((customerToken) =>
    getStadianClient().rep.checkout({
      customerToken,
      sessionToken: params.sessionToken,
      customerId: params.customerId,
      shippingAddress: params.shippingAddress ? { ...params.shippingAddress } : undefined,
      billingAddress: params.billingAddress ? { ...params.billingAddress } : undefined,
      shippingMethodId: params.shippingMethodId,
      notes: params.notes,
      paymentMethod: params.mode === "invoice" ? "invoice" : undefined,
      paymentToken: params.mode === "card" ? params.paymentToken : undefined,
      paymentType: params.mode === "card" ? params.paymentType : undefined,
      paymentFlow: params.mode === "link" ? "redirect" : undefined,
      sendPaymentLinkEmail: params.mode === "link" ? (params.sendPaymentLinkEmail ?? true) : false,
      acceptDisclaimers: params.acceptDisclaimers ?? false,
    })
  );
  if (!result.ok && (result.status === 0 || result.status >= 500)) {
    return {
      ...result,
      message: "We couldn't confirm the order result. Your sale is still open. When the store reconnects, check Orders before retrying to avoid placing the order twice.",
    };
  }
  return result;
}

export async function getRepOrders(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<RepResult<RepOrdersResponse>> {
  return withRepAuth((customerToken) =>
    getStadianClient().rep.listOrders({ customerToken, ...params })
  );
}

export async function getRepOrder(
  orderId: string
): Promise<RepResult<RepOrderSummary>> {
  return withRepAuth((customerToken) =>
    getStadianClient().rep.getOrder({ customerToken, orderId })
  );
}

export async function resendPaymentLink(
  orderId: string
): Promise<RepResult<{ ok: boolean }>> {
  return withRepAuth((customerToken) =>
    getStadianClient().rep.sendPaymentLink({ customerToken, orderId })
  );
}

export async function getRepDashboard(): Promise<RepResult<RepDashboard>> {
  return withRepAuth((customerToken) =>
    getStadianClient().rep.dashboard({ customerToken })
  );
}

/** Product catalog for the POS grid, priced with the rep's token (B2B stores
 *  hide prices from anonymous callers). Line prices in the CART come from the
 *  bound customer's tier; this grid price is indicative. */
/**
 * The POS catalog. Pass the attached customer so tiles price at THEIR tier —
 * without it the grid shows the rep's own pricing, which can disagree with the
 * cart line in front of the customer.
 */
export async function getRepProducts(
  customerId?: string
): Promise<RepResult<import("@stadian/storefront-sdk").StorefrontProduct[]>> {
  return withRepAuth(async (customerToken) => {
    const page = await getStadianClient().rep.listProducts({
      customerToken,
      customerId,
      limit: 100,
    });
    return page.items;
  });
}

export async function getRepProductCoas(slug: string): Promise<RepResult<ProductCoa[]>> {
  return withRepAuth(async (customerToken) => {
    const product = await getStadianClient().catalog.get(slug, { customerToken });
    return getProductCoas(product);
  });
}

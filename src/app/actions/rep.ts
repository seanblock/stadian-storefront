"use server";

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
      return { ok: false, code: err.code, message: err.message, status: err.status, details: err.details };
    }
    return {
      ok: false,
      code: "UNKNOWN",
      message: err instanceof Error ? err.message : "Something went wrong.",
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
  return withRepAuth((customerToken) =>
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

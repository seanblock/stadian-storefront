"use server";

import { getHttpClient } from "@/lib/stadian";
import { getCustomerToken } from "./auth";

/* ------------------------------------------------------------------ */
/*  Types — these mirror the backend API until the SDK adds a         */
/*  dedicated payments resource.                                      */
/* ------------------------------------------------------------------ */

export interface PaymentClientConfig {
  gateway_enabled: boolean;
  gateway_type: "nmi" | "authorizenet" | null;
  checkout_mode: "embedded" | "redirect";
  ach_enabled: boolean;
  js_library_url: string | null;
  public_key: string | null;
  form_config: Record<string, unknown>;
}

export interface StoredPaymentMethod {
  id: string;
  label: string;
  type: "card" | "ach";
  expires_at: string | null;
  is_default: boolean;
}

/**
 * A manual (offline) payment method the store accepts — Zelle, ACH, wire,
 * check. The buyer picks one at checkout, the order is placed as
 * `pending_payment`. Legacy methods email instructions; the Bank Transfer
 * plugin exposes instructions only on the authenticated order page.
 *
 * `details` is keyed by the tenant config field name (`zelle_email`,
 * `ach_routing_number`, …) and is already masked by the API — an account
 * number arrives as `****1234`. Safe to display; not enough to pay with.
 */
export interface ManualPaymentMethod {
  key: "venmo" | "cashapp" | "zelle" | "wire" | "ach" | "check" | "bank_transfer_ach" | "bank_transfer_wire";
  label: string;
  customer_instructions: string | null;
  details: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Server Actions                                                    */
/* ------------------------------------------------------------------ */

export async function getPaymentConfig(): Promise<PaymentClientConfig | null> {
  try {
    const http = getHttpClient();
    // NOTE: HttpClient prepends `${baseUrl}/v1/storefront`, so paths here are
    // relative to that. The backend route is /v1/storefront/payment-gateway/client-config.
    return await http.request<PaymentClientConfig>(
      "GET",
      "/payment-gateway/client-config",
    );
  } catch {
    return null;
  }
}

export async function getManualPaymentMethods(): Promise<ManualPaymentMethod[]> {
  try {
    const http = getHttpClient();
    // Backend route: /v1/storefront/payment-methods
    const res = await http.request<{ payment_methods: ManualPaymentMethod[] }>(
      "GET",
      "/payment-methods",
    );
    return res.payment_methods ?? [];
  } catch {
    return [];
  }
}

export async function getStoredPaymentMethods(): Promise<
  StoredPaymentMethod[]
> {
  const token = await getCustomerToken();
  if (!token) return [];

  try {
    const http = getHttpClient();
    // Backend route: /v1/storefront/stored-payment-methods → returns a bare list.
    return await http.request<StoredPaymentMethod[]>(
      "GET",
      "/stored-payment-methods",
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch {
    return [];
  }
}

export async function deletePaymentMethod(methodId: string): Promise<boolean> {
  const token = await getCustomerToken();
  if (!token) return false;

  try {
    const http = getHttpClient();
    await http.request("DELETE", `/stored-payment-methods/${methodId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch {
    return false;
  }
}

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

/* ------------------------------------------------------------------ */
/*  Server Actions                                                    */
/* ------------------------------------------------------------------ */

export async function getPaymentConfig(): Promise<PaymentClientConfig | null> {
  try {
    const http = getHttpClient();
    return await http.request<PaymentClientConfig>(
      "GET",
      "/storefront/payments/config",
    );
  } catch {
    return null;
  }
}

export async function getStoredPaymentMethods(): Promise<
  StoredPaymentMethod[]
> {
  const token = await getCustomerToken();
  if (!token) return [];

  try {
    const http = getHttpClient();
    const res = await http.request<{ items: StoredPaymentMethod[] }>(
      "GET",
      "/storefront/payments/methods",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.items;
  } catch {
    return [];
  }
}

export async function deletePaymentMethod(methodId: string): Promise<boolean> {
  const token = await getCustomerToken();
  if (!token) return false;

  try {
    const http = getHttpClient();
    await http.request("DELETE", `/storefront/payments/methods/${methodId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch {
    return false;
  }
}

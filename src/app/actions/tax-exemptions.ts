"use server";

import { getStadianClient } from "@/lib/stadian";
import { getValidCustomerToken } from "@/lib/customer-token";
import { StadianError, type StorefrontTaxExemption, type TaxExemptionInput } from "@stadian/storefront-sdk";

/** Expected failures come back as data (Next masks thrown server-action errors). */
export type TaxExemptionResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function withCustomer<T>(fn: (token: string) => Promise<T>): Promise<TaxExemptionResult<T>> {
  const token = await getValidCustomerToken();
  if (!token) return { ok: false, message: "Your session expired — sign in again." };
  try {
    return { ok: true, data: await fn(token) };
  } catch (err) {
    if (err instanceof StadianError && err.status > 0 && err.status < 500) return { ok: false, message: err.message };
    return { ok: false, message: "The store is temporarily unavailable. Please try again shortly." };
  }
}

export async function listTaxExemptions(): Promise<TaxExemptionResult<StorefrontTaxExemption[]>> {
  return withCustomer((customerToken) => getStadianClient().customers.taxExemptions({ customerToken }));
}

export async function submitTaxExemption(input: TaxExemptionInput): Promise<TaxExemptionResult<StorefrontTaxExemption>> {
  return withCustomer((customerToken) => getStadianClient().customers.submitTaxExemption({ customerToken, ...input }));
}

export async function taxExemptionDocumentUrl(exemptionId: string): Promise<TaxExemptionResult<string>> {
  return withCustomer(async (customerToken) =>
    (await getStadianClient().customers.taxExemptionDocument({ customerToken, exemptionId })).download_url,
  );
}

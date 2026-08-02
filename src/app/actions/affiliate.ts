"use server";

import { getStadianClient } from "@/lib/stadian";
import { getCustomerToken } from "./auth";
import {
  StadianAuthError,
  type StorefrontCommission,
  type StorefrontPayout,
} from "@stadian/storefront-sdk";

// A missing OR stale session yields the same signed-out shape (empty list);
// StadianAuthError must not escape a server action — prod masks it.

export async function getCommissions(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: StorefrontCommission[] }> {
  const token = await getCustomerToken();
  if (!token) return { items: [] };

  const client = getStadianClient();
  try {
    return await client.customers.commissions({
      customerToken: token,
      status: params?.status,
      limit: params?.limit,
      offset: params?.offset,
    });
  } catch (err) {
    if (err instanceof StadianAuthError) return { items: [] };
    throw err;
  }
}

export async function getPayouts(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ items: StorefrontPayout[] }> {
  const token = await getCustomerToken();
  if (!token) return { items: [] };

  const client = getStadianClient();
  try {
    return await client.customers.payouts({
      customerToken: token,
      limit: params?.limit,
      offset: params?.offset,
    });
  } catch (err) {
    if (err instanceof StadianAuthError) return { items: [] };
    throw err;
  }
}

"use server";

import { getStadianClient } from "@/lib/stadian";
import { getCustomerToken } from "./auth";
import type {
  StorefrontCommission,
  StorefrontPayout,
} from "@stadian/storefront-sdk";

export async function getCommissions(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: StorefrontCommission[] }> {
  const token = await getCustomerToken();
  if (!token) return { items: [] };

  const client = getStadianClient();
  return client.customers.commissions({
    customerToken: token,
    status: params?.status,
    limit: params?.limit,
    offset: params?.offset,
  });
}

export async function getPayouts(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ items: StorefrontPayout[] }> {
  const token = await getCustomerToken();
  if (!token) return { items: [] };

  const client = getStadianClient();
  return client.customers.payouts({
    customerToken: token,
    limit: params?.limit,
    offset: params?.offset,
  });
}

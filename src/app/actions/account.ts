"use server";

import { cookies } from "next/headers";
import { getStadianClient } from "@/lib/stadian";
import type { StorefrontOrder, PaginatedList } from "@stadian/storefront-sdk";

export async function getOrderHistory(
  limit = 20,
  offset = 0,
): Promise<PaginatedList<StorefrontOrder>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("stadian_customer_token")?.value;
  if (!token) return { items: [], total: 0, page: 1, limit };

  const client = getStadianClient();
  return client.orders.list({ customerToken: token, limit, offset });
}

"use server";

import { getCustomerToken } from "./auth";

export async function getOrderHistory(): Promise<[]> {
  const token = await getCustomerToken();
  if (!token) return [];

  // The SDK doesn't have a dedicated order history endpoint yet.
  // This will be connected when the API endpoint exists.
  return [];
}

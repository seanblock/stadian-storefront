"use server";

import { getStadianClient } from "@/lib/stadian";
import { getCustomerToken } from "@/lib/customer-token";
import { StadianError, type StorefrontCart } from "@stadian/storefront-sdk";

export async function getCart(sessionId: string): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.get({
    sessionToken: sessionId,
    customerToken: await getCustomerToken(),
  });
}

export async function addToCart(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.addItem({
    sessionToken: sessionId,
    productId,
    quantity,
    customerToken: await getCustomerToken(),
  });
}

export async function updateCartItem(
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.updateItem({
    sessionToken: sessionId,
    itemId,
    quantity,
    customerToken: await getCustomerToken(),
  });
}

export async function removeCartItem(
  sessionId: string,
  itemId: string
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.removeItem({
    sessionToken: sessionId,
    itemId,
    customerToken: await getCustomerToken(),
  });
}

export async function applyDiscountCode(
  sessionId: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await getStadianClient().cart.applyCode({
      sessionToken: sessionId,
      code,
      customerToken: await getCustomerToken(),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof StadianError ? err.message : "Failed to apply code";
    return { success: false, error: message };
  }
}

export async function removeDiscountCode(sessionId: string): Promise<StorefrontCart> {
  return getStadianClient().cart.removeCode({
    sessionToken: sessionId,
    customerToken: await getCustomerToken(),
  });
}

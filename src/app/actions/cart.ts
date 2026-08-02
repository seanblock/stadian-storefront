"use server";

import { getStadianClient } from "@/lib/stadian";
import { fetchWithOptionalAuth } from "@/lib/authed-fetch";
import { StadianError, type StorefrontCart } from "@stadian/storefront-sdk";

// Every cart call runs through fetchWithOptionalAuth: a stale customer token
// retries the same call as a guest instead of throwing StadianAuthError back
// through the server action (which production masks into a useless generic
// error). B2B stores then return the closed-cart shape the UI already handles.

export async function getCart(sessionId: string): Promise<StorefrontCart> {
  const client = getStadianClient();
  return fetchWithOptionalAuth((customerToken) =>
    client.cart.get({ sessionToken: sessionId, customerToken })
  );
}

export async function addToCart(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return fetchWithOptionalAuth((customerToken) =>
    client.cart.addItem({
      sessionToken: sessionId,
      productId,
      quantity,
      customerToken,
    })
  );
}

export async function updateCartItem(
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return fetchWithOptionalAuth((customerToken) =>
    client.cart.updateItem({
      sessionToken: sessionId,
      itemId,
      quantity,
      customerToken,
    })
  );
}

export async function removeCartItem(
  sessionId: string,
  itemId: string
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return fetchWithOptionalAuth((customerToken) =>
    client.cart.removeItem({
      sessionToken: sessionId,
      itemId,
      customerToken,
    })
  );
}

export async function applyDiscountCode(
  sessionId: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await fetchWithOptionalAuth((customerToken) =>
      getStadianClient().cart.applyCode({
        sessionToken: sessionId,
        code,
        customerToken,
      })
    );
    return { success: true };
  } catch (err) {
    const message = err instanceof StadianError ? err.message : "Failed to apply code";
    return { success: false, error: message };
  }
}

export async function removeDiscountCode(sessionId: string): Promise<StorefrontCart> {
  return fetchWithOptionalAuth((customerToken) =>
    getStadianClient().cart.removeCode({
      sessionToken: sessionId,
      customerToken,
    })
  );
}

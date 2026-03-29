"use server";

import { getStadianClient } from "@/lib/stadian";
import type { StorefrontCart } from "@stadian/storefront-sdk";

export async function getCart(sessionId: string): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.get({ sessionToken: sessionId });
}

export async function addToCart(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.addItem({ sessionToken: sessionId, productId, quantity });
}

export async function updateCartItem(
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.updateItem({ sessionToken: sessionId, itemId, quantity });
}

export async function removeCartItem(
  sessionId: string,
  itemId: string
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.removeItem({ sessionToken: sessionId, itemId });
}

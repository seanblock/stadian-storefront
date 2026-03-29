"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { StorefrontCart } from "@stadian/storefront-sdk";
import { getSessionId } from "@/lib/session";
import {
  getCart,
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  removeCartItem as removeCartItemAction,
} from "@/app/actions/cart";

interface CartContextValue {
  cart: StorefrontCart | null;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      const data = await getCart(sessionId);
      setCart(data);
    } catch {
      // Cart fetch failed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (productId: string, quantity = 1) => {
    const sessionId = getSessionId();
    const updated = await addToCartAction(sessionId, productId, quantity);
    setCart(updated);
  }, []);

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    const sessionId = getSessionId();
    const updated = await updateCartItemAction(sessionId, itemId, quantity);
    setCart(updated);
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    const sessionId = getSessionId();
    const updated = await removeCartItemAction(sessionId, itemId);
    setCart(updated);
  }, []);

  return (
    <CartContext value={{ cart, loading, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

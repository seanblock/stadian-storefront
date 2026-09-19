"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { StorefrontCart } from "@stadian/storefront-sdk";
import { getSessionId, clearSession } from "@/lib/session";
import {
  getCart,
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  removeCartItem as removeCartItemAction,
} from "@/app/actions/cart";

interface CartContextValue {
  cart: StorefrontCart | null;
  loading: boolean;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
  resetCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * The backend can return cart items in a different order across refetches (it
 * sorts by last-updated), which makes a row jump position the instant you edit
 * its quantity. Pin a stable order by id so the drawer and checkout summary
 * never reshuffle under the user.
 */
function withStableItemOrder(cart: StorefrontCart | null): StorefrontCart | null {
  if (!cart) return cart;
  return {
    ...cart,
    items: [...cart.items].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function CartProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  /**
   * False on a wholesale store when the visitor is signed out — the cart API is
   * closed to them, so fetching it would only produce 401s.
   */
  enabled?: boolean;
}) {
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const cartGeneration = useRef(0);

  const resetCart = useCallback(() => {
    // Ignore responses still in flight for the cart that was just checked out.
    cartGeneration.current += 1;
    clearSession();
    setCart(null);
    setDrawerOpen(false);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const generation = cartGeneration.current;
    if (!enabled) {
      setCart(null);
      setLoading(false);
      return;
    }
    try {
      const sessionId = getSessionId();
      const data = await getCart(sessionId);
      if (generation === cartGeneration.current) setCart(withStableItemOrder(data));
    } catch (err) {
      // Don't crash the UI if the cart can't load, but don't fail silently either.
      console.error("Failed to load cart:", err);
    } finally {
      if (generation === cartGeneration.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh is a useCallback async fetcher; setState is indirect, not inline
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (productId: string, quantity = 1) => {
    const generation = cartGeneration.current;
    const sessionId = getSessionId();
    const updated = await addToCartAction(sessionId, productId, quantity);
    if (generation !== cartGeneration.current) return;
    setCart(withStableItemOrder(updated));
    setDrawerOpen(true);
  }, []);

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    const generation = cartGeneration.current;
    const sessionId = getSessionId();
    const updated = await updateCartItemAction(sessionId, itemId, quantity);
    if (generation !== cartGeneration.current) return;
    setCart(withStableItemOrder(updated));
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    const generation = cartGeneration.current;
    const sessionId = getSessionId();
    const updated = await removeCartItemAction(sessionId, itemId);
    if (generation !== cartGeneration.current) return;
    setCart(withStableItemOrder(updated));
  }, []);

  return (
    <CartContext value={{ cart, loading, isDrawerOpen, setDrawerOpen, addItem, updateItem, removeItem, refresh, resetCart }}>
      {children}
    </CartContext>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

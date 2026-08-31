"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { RepCustomer, StorefrontCart } from "@stadian/storefront-sdk";
import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
  applyDiscountCode,
  removeDiscountCode,
} from "@/app/actions/cart";
import { bindRepCart } from "@/app/actions/rep";

/**
 * One in-progress POS sale. The sale gets its OWN cart session UUID — never
 * the shopper cart in localStorage (stadian_session_id) — so a rep's personal
 * cart and the sale never mix. Persisted to sessionStorage so a mid-sale
 * refresh doesn't lose the cart; cleared on completion or cancel.
 */
const STORAGE_KEY = "stadian_rep_sale";

interface StoredSale {
  saleSessionId: string;
  customer: RepCustomer | null;
}

interface RepSaleContextValue {
  saleSessionId: string | null;
  /**
   * False until the persisted sale has been read back. Callers must not mint a
   * new sale before this flips, or they race hydration and wipe the stored one.
   */
  hydrated: boolean;
  customer: RepCustomer | null;
  cart: StorefrontCart | null;
  cartBusy: boolean;
  /** Begin a fresh sale (new cart session, no customer). */
  startSale: () => string;
  /** Attach the customer — binds the cart server-side so prices use THEIR tier. */
  selectCustomer: (customer: RepCustomer) => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCode: () => Promise<void>;
  refreshCart: () => Promise<void>;
  /** Wipe the sale (after completion or explicit cancel). */
  clearSale: () => void;
}

const RepSaleContext = createContext<RepSaleContextValue | null>(null);

function readStored(): StoredSale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSale) : null;
  } catch {
    return null;
  }
}

export function RepSaleProvider({ children }: { children: ReactNode }) {
  const [saleSessionId, setSaleSessionId] = useState<string | null>(null);
  const [customer, setCustomerState] = useState<RepCustomer | null>(null);
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [cartBusy, setCartBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate a persisted sale after mount (sessionStorage is client-only).
  // State lands in the async continuation so the effect body itself never
  // sets state synchronously (react-hooks/set-state-in-effect).
  //
  // `hydrated` must flip on BOTH paths: consumers gate their "no sale yet, mint
  // one" fallback on it. React runs child effects before parent ones, so a page
  // that minted unconditionally on mount would overwrite sessionStorage before
  // this ever read it — which silently dropped the customer and cart on every
  // mid-sale refresh.
  useEffect(() => {
    const stored = readStored();
    let cancelled = false;
    (async () => {
      if (!stored) {
        if (!cancelled) setHydrated(true);
        return;
      }
      let hydratedCart: StorefrontCart | null = null;
      try {
        hydratedCart = await getCart(stored.saleSessionId);
      } catch {
        hydratedCart = null;
      }
      if (cancelled) return;
      setSaleSessionId(stored.saleSessionId);
      setCustomerState(stored.customer);
      setCart(hydratedCart);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((sale: StoredSale | null) => {
    try {
      if (sale) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sale));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable — the sale just won't survive a refresh.
    }
  }, []);

  const startSale = useCallback(() => {
    const id = crypto.randomUUID();
    setSaleSessionId(id);
    setCustomerState(null);
    setCart(null);
    persist({ saleSessionId: id, customer: null });
    return id;
  }, [persist]);

  const selectCustomer = useCallback(
    async (next: RepCustomer) => {
      const id = saleSessionId ?? startSale();
      const result = await bindRepCart({ sessionToken: id, customerId: next.id });
      if (!result.ok) throw new Error(result.message);
      setCustomerState(next);
      persist({ saleSessionId: id, customer: next });
      // Rebound cart may reprice existing lines at the customer's tier.
      try {
        setCart(await getCart(id));
      } catch {
        /* cart may not exist yet */
      }
    },
    [saleSessionId, startSale, persist]
  );

  const requireSession = useCallback((): string => {
    if (!saleSessionId) throw new Error("No active sale");
    return saleSessionId;
  }, [saleSessionId]);

  const addItem = useCallback(
    async (productId: string, quantity: number) => {
      const id = requireSession();
      setCartBusy(true);
      try {
        setCart(await addToCart(id, productId, quantity));
      } finally {
        setCartBusy(false);
      }
    },
    [requireSession]
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      const id = requireSession();
      setCartBusy(true);
      try {
        setCart(await updateCartItem(id, itemId, quantity));
      } finally {
        setCartBusy(false);
      }
    },
    [requireSession]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const id = requireSession();
      setCartBusy(true);
      try {
        setCart(await removeCartItem(id, itemId));
      } finally {
        setCartBusy(false);
      }
    },
    [requireSession]
  );

  const applyCode = useCallback(
    async (code: string) => {
      const id = requireSession();
      const result = await applyDiscountCode(id, code);
      if (result.success) setCart(await getCart(id));
      return result;
    },
    [requireSession]
  );

  const removeCode = useCallback(async () => {
    const id = requireSession();
    setCart(await removeDiscountCode(id));
  }, [requireSession]);

  const refreshCart = useCallback(async () => {
    if (!saleSessionId) return;
    try {
      setCart(await getCart(saleSessionId));
    } catch {
      setCart(null);
    }
  }, [saleSessionId]);

  const clearSale = useCallback(() => {
    setSaleSessionId(null);
    setCustomerState(null);
    setCart(null);
    persist(null);
  }, [persist]);

  return (
    <RepSaleContext
      value={{
        saleSessionId,
        hydrated,
        customer,
        cart,
        cartBusy,
        startSale,
        selectCustomer,
        addItem,
        updateItem,
        removeItem,
        applyCode,
        removeCode,
        refreshCart,
        clearSale,
      }}
    >
      {children}
    </RepSaleContext>
  );
}

export function useRepSale(): RepSaleContextValue {
  const ctx = useContext(RepSaleContext);
  if (!ctx) throw new Error("useRepSale must be used within RepSaleProvider");
  return ctx;
}

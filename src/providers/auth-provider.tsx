"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { StorefrontCustomerProfile } from "@stadian/storefront-sdk";
import {
  loginCustomer as loginAction,
  registerCustomer as registerAction,
  getCustomerProfile,
  logoutCustomer as logoutAction,
} from "@/app/actions/auth";

interface AuthContextValue {
  customer: StorefrontCustomerProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAffiliate: boolean;
  /** Role allows placing orders on behalf of customers — unlocks /rep. */
  isSalesRep: boolean;
  login: (email: string, password: string) => Promise<StorefrontCustomerProfile>;
  register: (data: RegisterData) => Promise<StorefrontCustomerProfile>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Carries the API's error code so callers can branch on it, not on wording. */
export class AuthFailure extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "AuthFailure";
  }
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  customerType?: "individual" | "business";
  companyName?: string;
  companyTaxId?: string;
  companyWebsite?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] =
    useState<StorefrontCustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const profile = await getCustomerProfile();
      setCustomer(profile);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh is a useCallback async fetcher; setState is indirect, not inline
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAction(email, password);
    // The action returns failures rather than throwing (Next.js masks
    // server-action errors in production); re-throw client-side so callers keep
    // their try/catch and the API's message reaches the user intact.
    if (!result.ok) throw new AuthFailure(result.message, result.code);
    setCustomer(result.response.customer);
    // Returned so callers can branch on the fresh profile (e.g. the login page
    // sends sales reps to /rep) without racing the state update.
    return result.response.customer;
  }, []);

  const register = useCallback(
    async (data: RegisterData) => {
      const result = await registerAction(data);
      if (!result.ok) throw new AuthFailure(result.message, result.code);
      const profile = result.customer;
      // An approval-mode store creates the account "pending" — signing in would
      // be refused, so hand the profile back and let the caller say so.
      if (profile.account_status === "pending") return profile;
      await login(data.email, data.password);
      return profile;
    },
    [login]
  );

  const logout = useCallback(async () => {
    await logoutAction();
    setCustomer(null);
  }, []);

  const isAuthenticated = customer !== null;
  const isAffiliate =
    customer?.affiliate_code !== null &&
    customer?.affiliate_code !== undefined;
  const isSalesRep = customer?.is_sales_rep === true;

  return (
    <AuthContext
      value={{
        customer,
        loading,
        isAuthenticated,
        isAffiliate,
        isSalesRep,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

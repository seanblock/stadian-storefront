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
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
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
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginAction(email, password);
    setCustomer(response.customer);
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => {
      await registerAction(data);
      // After registration, auto-login
      await login(data.email, data.password);
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

  return (
    <AuthContext
      value={{
        customer,
        loading,
        isAuthenticated,
        isAffiliate,
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

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { StorefrontCustomerProfile, TaxExemptionInput } from "@stadian/storefront-sdk";
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
  login: (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => Promise<StorefrontCustomerProfile>;
  register: (data: RegisterData) => Promise<RegisterOutcome>;
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

export interface RegisterOutcome {
  customer: StorefrontCustomerProfile;
  /** Whether the new customer is already signed in. False on approval-mode
   *  stores (the account is "pending" and cannot sign in), and on the rare
   *  case where the account was created but the automatic sign-in failed. */
  signedIn: boolean;
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
  /** Turnstile challenge response, verified server-side before the account is
   *  created. Absent when Turnstile isn't configured. */
  turnstileToken?: string;
  /** The visitor ticked "I agree to the Terms of Service and Privacy Policy".
   *  Recorded against the tenant's active versions once the account exists. */
  acceptedTerms?: boolean;
  /** Wholesale applicant's resale certificate details (reviewed by staff). */
  taxExemption?: TaxExemptionInput;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
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

  const login = useCallback(async (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => {
    const result = await loginAction(email, password, turnstileToken);
    // The action returns failures rather than throwing (Next.js masks
    // server-action errors in production); re-throw client-side so callers keep
    // their try/catch and the API's message reaches the user intact.
    if (!result.ok) throw new AuthFailure(result.message, result.code);
    setCustomer(result.response.customer);
    // Returned so callers can branch on the fresh profile (e.g. the login page
    // sends sales reps to /rep) without racing the state update.
    return result.response.customer;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const result = await registerAction(data);
    if (!result.ok) throw new AuthFailure(result.message, result.code);
    const profile = result.customer;
    // registerCustomer signs the new customer in itself — a second sign-in from
    // here would need its own Turnstile token, and the one spent registering is
    // single-use. An approval-mode store returns signedIn: false, because a
    // "pending" account can't sign in at all; the caller says so.
    if (result.signedIn) setCustomer(profile);
    return { customer: profile, signedIn: result.signedIn };
  }, []);

  const logout = useCallback(async () => {
    await logoutAction();
    setCustomer(null);
    // Signing out from inside /account would otherwise leave the customer on a
    // page they can no longer see the contents of. Send them home, and refresh
    // so server components re-render without the (now deleted) auth cookies.
    router.replace("/");
    router.refresh();
  }, [router]);

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

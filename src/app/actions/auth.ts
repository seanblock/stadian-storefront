"use server";

import { cookies } from "next/headers";
import { getStadianClient, getVisitorClient, getVisitorIp } from "@/lib/stadian";
import { recordDisclaimerAcceptance } from "@/lib/disclaimers";
import {
  StadianAuthError,
  StadianError,
  type StorefrontCustomerProfile,
  type StorefrontLoginResponse,
} from "@stadian/storefront-sdk";

import { getValidCustomerToken } from "@/lib/customer-token";
import {
  TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  TOKEN_COOKIE_MAX_AGE,
  REFRESH_COOKIE_MAX_AGE,
  authCookieOptions,
} from "@/lib/auth-cookies";

export type LoginResult =
  | { ok: true; response: StorefrontLoginResponse }
  | { ok: false; code: string; message: string };

/** Start the customer's session. Both sign-in paths land here. */
async function setSessionCookies(response: StorefrontLoginResponse) {
  const cookieStore = await cookies();
  cookieStore.set(
    TOKEN_COOKIE,
    response.access_token,
    authCookieOptions(TOKEN_COOKIE_MAX_AGE)
  );

  if (response.refresh_token) {
    cookieStore.set(
      REFRESH_TOKEN_COOKIE,
      response.refresh_token,
      authCookieOptions(REFRESH_COOKIE_MAX_AGE)
    );
  }
}

/** Sign in and start a session.
 *
 *  The Turnstile token (when the store uses Turnstile) is verified by the API
 *  against that tenant's own secret — this storefront never holds it. */
async function signIn(
  email: string,
  password: string,
  turnstileToken?: string
): Promise<LoginResult> {
  const client = await getVisitorClient();

  let response: StorefrontLoginResponse;
  try {
    response = await client.customers.login({ email, password, turnstileToken });
  } catch (err) {
    // Returned, not thrown: Next.js replaces server-action errors with a generic
    // message in production, which would swallow "awaiting approval".
    if (err instanceof StadianError) {
      return { ok: false, code: err.code, message: err.message };
    }
    return { ok: false, code: "UNKNOWN", message: "Invalid email or password" };
  }

  await setSessionCookies(response);
  return { ok: true, response };
}

export async function loginCustomer(
  email: string,
  password: string,
  turnstileToken?: string
): Promise<LoginResult> {
  return signIn(email, password, turnstileToken);
}

export type RegisterResult =
  | {
      ok: true;
      customer: StorefrontCustomerProfile;
      /** True when the session is already live — the caller must NOT sign in
       *  again. False on approval-mode stores, where the account exists but
       *  can't sign in yet. */
      signedIn: boolean;
    }
  | { ok: false; code: string; message: string };

export async function registerCustomer(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  customerType?: "individual" | "business";
  companyName?: string;
  companyTaxId?: string;
  companyWebsite?: string;
  turnstileToken?: string;
  /** Registration form's "I agree to the Terms of Service and Privacy Policy". */
  acceptedTerms?: boolean;
}): Promise<RegisterResult> {
  if (!data.acceptedTerms) {
    return {
      ok: false,
      code: "TERMS_NOT_ACCEPTED",
      message: "Please agree to the Terms of Service and Privacy Policy to continue.",
    };
  }

  const client = await getVisitorClient();
  try {
    const customer = await client.customers.register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      customerType: data.customerType,
      companyName: data.companyName,
      companyTaxId: data.companyTaxId,
      companyWebsite: data.companyWebsite,
      turnstileToken: data.turnstileToken,
    });

    // Registration issues the session itself, so we never call login here: that
    // second call would face its own Turnstile check, and the token just spent
    // on registering can't be replayed. One challenge, one signup.
    //
    // Approval-mode stores create the account "pending" and issue no tokens.
    if (!customer.access_token || !customer.refresh_token) {
      return { ok: true, customer, signedIn: false };
    }

    await setSessionCookies({
      access_token: customer.access_token,
      refresh_token: customer.refresh_token,
      customer,
    });

    // The acceptance endpoint is customer-scoped, so this is the first moment
    // it can be recorded: the account exists and we hold its token. (Approval-
    // mode stores return no token, so their assent cannot be recorded until
    // the API accepts it on the register call itself.) The account is already
    // created; a failed record must not turn a successful signup into an error.
    await recordTermsAcceptance(customer.access_token);

    return { ok: true, customer, signedIn: true };
  } catch (err) {
    // Same reasoning as loginCustomer: keep the API's message readable in prod.
    if (err instanceof StadianError) {
      return { ok: false, code: err.code, message: err.message };
    }
    return { ok: false, code: "UNKNOWN", message: "Registration failed. Please try again." };
  }
}

/**
 * Record the new customer's assent to the tenant's active Terms of Service
 * and Privacy Policy versions. Best-effort by design (see caller); failures
 * are logged so a broken disclaimer setup is visible without blocking signup.
 */
async function recordTermsAcceptance(accessToken: string): Promise<void> {
  const ip = await getVisitorIp();
  const results = await Promise.allSettled(
    (["terms_of_service", "privacy_policy"] as const).map((type) =>
      recordDisclaimerAcceptance(type, accessToken, ip),
    ),
  );
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to record disclaimer acceptance at registration", result.reason);
    }
  }
}

export async function refreshSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return false;

  try {
    const client = getStadianClient();
    const response = await client.customers.refreshToken({ refreshToken });
    cookieStore.set(
      TOKEN_COOKIE,
      response.access_token,
      authCookieOptions(TOKEN_COOKIE_MAX_AGE)
    );
    if (response.refresh_token) {
      cookieStore.set(
        REFRESH_TOKEN_COOKIE,
        response.refresh_token,
        authCookieOptions(REFRESH_COOKIE_MAX_AGE)
      );
    }
    return true;
  } catch {
    cookieStore.delete(TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
    return false;
  }
}

export async function getCustomerProfile(): Promise<StorefrontCustomerProfile | null> {
  // Only present live tokens; an expired one would just 401. If the access
  // token has lapsed but a refresh token remains, rotate first.
  let token = await getValidCustomerToken();
  if (!token) {
    const refreshed = await refreshSession();
    if (!refreshed) return null;
    token = await getValidCustomerToken();
  }
  if (!token) return null;

  try {
    const client = getStadianClient();
    return await client.customers.me({ customerToken: token });
  } catch {
    const refreshed = await refreshSession();
    if (!refreshed) return null;

    const newToken = (await cookies()).get(TOKEN_COOKIE)?.value;
    if (!newToken) return null;

    try {
      const client = getStadianClient();
      return await client.customers.me({ customerToken: newToken });
    } catch {
      return null;
    }
  }
}

export async function getCustomerToken(): Promise<string | null> {
  // Valid-only: callers use this to decide whether to act as a signed-in
  // customer, and an expired token must not count as signed in.
  return (await getValidCustomerToken()) ?? null;
}

export async function logoutCustomer(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function forgotPassword(email: string): Promise<{ ok: boolean }> {
  const client = await getVisitorClient();
  return client.customers.forgotPassword({ email });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ ok: boolean }> {
  const client = getStadianClient();
  return client.customers.resetPassword({ token, newPassword });
}

export async function verifyEmail(token: string): Promise<{ ok: boolean }> {
  const client = getStadianClient();
  return client.customers.verifyEmail({ token });
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<StorefrontCustomerProfile | null> {
  const token = await getValidCustomerToken();
  if (!token) return null;

  const client = getStadianClient();
  try {
    return await client.customers.update({
      customerToken: token,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });
  } catch (err) {
    // A lapsed session behaves like "not signed in" — the same shape as a
    // missing token — instead of throwing (server-action throws are masked
    // in production).
    if (err instanceof StadianAuthError) return null;
    throw err;
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean }> {
  const token = await getValidCustomerToken();
  if (!token) return { ok: false };

  const client = getStadianClient();
  try {
    return await client.customers.changePassword({
      customerToken: token,
      currentPassword,
      newPassword,
    });
  } catch (err) {
    // Expired session or wrong current password — return the action's normal
    // failure shape rather than a raw throw the client can't read in prod.
    if (err instanceof StadianAuthError) return { ok: false };
    throw err;
  }
}

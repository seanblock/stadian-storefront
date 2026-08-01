"use server";

import { cookies } from "next/headers";
import { getStadianClient } from "@/lib/stadian";
import {
  StadianError,
  type StorefrontCustomerProfile,
  type StorefrontLoginResponse,
} from "@stadian/storefront-sdk";

import { TOKEN_COOKIE, getCustomerToken as readCustomerToken } from "@/lib/customer-token";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const REFRESH_TOKEN_COOKIE = "stadian_refresh_token";
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type LoginResult =
  | { ok: true; response: StorefrontLoginResponse }
  | { ok: false; code: string; message: string };

export async function loginCustomer(
  email: string,
  password: string
): Promise<LoginResult> {
  const client = getStadianClient();

  let response: StorefrontLoginResponse;
  try {
    response = await client.customers.login({ email, password });
  } catch (err) {
    // Returned, not thrown: Next.js replaces server-action errors with a generic
    // message in production, which would swallow "awaiting approval".
    if (err instanceof StadianError) {
      return { ok: false, code: err.code, message: err.message };
    }
    return { ok: false, code: "UNKNOWN", message: "Invalid email or password" };
  }

  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, response.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  if (response.refresh_token) {
    cookieStore.set(REFRESH_TOKEN_COOKIE, response.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return { ok: true, response };
}

export type RegisterResult =
  | { ok: true; customer: StorefrontCustomerProfile }
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
}): Promise<RegisterResult> {
  const client = getStadianClient();
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
    });
    return { ok: true, customer };
  } catch (err) {
    // Same reasoning as loginCustomer: keep the API's message readable in prod.
    if (err instanceof StadianError) {
      return { ok: false, code: err.code, message: err.message };
    }
    return { ok: false, code: "UNKNOWN", message: "Registration failed. Please try again." };
  }
}

export async function refreshSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return false;

  try {
    const client = getStadianClient();
    const response = await client.customers.refreshToken({ refreshToken });
    cookieStore.set(TOKEN_COOKIE, response.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    if (response.refresh_token) {
      cookieStore.set(REFRESH_TOKEN_COOKIE, response.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REFRESH_COOKIE_MAX_AGE,
        path: "/",
      });
    }
    return true;
  } catch {
    cookieStore.delete(TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
    return false;
  }
}

export async function getCustomerProfile(): Promise<StorefrontCustomerProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
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
  return (await readCustomerToken()) ?? null;
}

export async function logoutCustomer(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function forgotPassword(email: string): Promise<{ ok: boolean }> {
  const client = getStadianClient();
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
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  const client = getStadianClient();
  return client.customers.update({
    customerToken: token,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return { ok: false };

  const client = getStadianClient();
  return client.customers.changePassword({
    customerToken: token,
    currentPassword,
    newPassword,
  });
}

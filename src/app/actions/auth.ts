"use server";

import { cookies } from "next/headers";
import { getStadianClient } from "@/lib/stadian";
import type {
  StorefrontCustomerProfile,
  StorefrontLoginResponse,
} from "@stadian/storefront-sdk";

const TOKEN_COOKIE = "stadian_customer_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function loginCustomer(
  email: string,
  password: string
): Promise<StorefrontLoginResponse> {
  const client = getStadianClient();
  const response = await client.customers.login({ email, password });

  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, response.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}

export async function registerCustomer(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<StorefrontCustomerProfile> {
  const client = getStadianClient();
  return client.customers.register({
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
  });
}

export async function getCustomerProfile(): Promise<StorefrontCustomerProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const client = getStadianClient();
    return await client.customers.me({ customerToken: token });
  } catch {
    // Token invalid/expired — clear it
    cookieStore.delete(TOKEN_COOKIE);
    return null;
  }
}

export async function getCustomerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value ?? null;
}

export async function logoutCustomer(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}

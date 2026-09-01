import { headers } from "next/headers";
import { StadianClient, HttpClient } from "@stadian/storefront-sdk";

let client: StadianClient | null = null;
let httpClient: HttpClient | null = null;

function getConfig() {
  const apiKey = process.env.STADIAN_API_KEY;
  const baseUrl = process.env.STADIAN_API_URL;
  if (!apiKey || !baseUrl) {
    throw new Error(
      "Missing STADIAN_API_KEY or STADIAN_API_URL environment variables"
    );
  }
  return { apiKey, baseUrl };
}

export function getStadianClient(): StadianClient {
  if (!client) {
    client = new StadianClient(getConfig());
  }
  return client;
}

/** Low-level HTTP client for SDK endpoints not yet wrapped by a resource. */
export function getHttpClient(): HttpClient {
  if (!httpClient) {
    httpClient = new HttpClient(getConfig());
  }
  return httpClient;
}

/**
 * The visitor's IP, as seen by the edge. Vercel sets both headers; the first
 * entry of X-Forwarded-For is the client, later ones are proxies.
 */
export async function getVisitorIp(): Promise<string | undefined> {
  const h = await headers();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || undefined;
}

/**
 * A client bound to the visitor being served, so the API can tell one visitor
 * from another.
 *
 * We call the API server-side with a secret key, which means every request we
 * make arrives from the same address. The API's rate limiter and card-testing
 * guard would then see one enormous customer instead of thousands of small
 * ones — and a single bot's traffic would rate-limit the whole store. Use this
 * (not the cached singleton) for anything a visitor can trigger repeatedly:
 * sign-in, registration, password reset, checkout.
 *
 * Deliberately not cached — the IP differs per request, and a shared instance
 * would attribute one visitor's traffic to whoever built it first.
 */
export async function getVisitorClient(): Promise<StadianClient> {
  return new StadianClient({ ...getConfig(), clientIp: await getVisitorIp() });
}

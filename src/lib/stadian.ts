import { cookies, headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { StadianClient, HttpClient } from "@stadian/storefront-sdk";
import { PREVIEW_GRANT_COOKIE } from "./preview-access";

let client: StadianClient | null = null;
let httpClient: HttpClient | null = null;
let sharedClient: StadianClient | null = null;
let sharedHttpClient: HttpClient | null = null;

/**
 * The visitor's preview grant, so a closed store's API serves someone who
 * entered the password. Read per request; outside one (a build) there is none.
 */
async function previewGrantHeaders(): Promise<Record<string, string>> {
  let grant: string | undefined;
  try {
    grant = (await cookies()).get(PREVIEW_GRANT_COOKIE)?.value;
  } catch (err) {
    unstable_rethrow(err);
    return {};
  }
  return grant ? { "X-Storefront-Preview": grant } : {};
}

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
    client = new StadianClient({ ...getConfig(), requestHeaders: previewGrantHeaders });
  }
  return client;
}

/** Low-level HTTP client for SDK endpoints not yet wrapped by a resource. */
export function getHttpClient(): HttpClient {
  if (!httpClient) {
    httpClient = new HttpClient({ ...getConfig(), requestHeaders: previewGrantHeaders });
  }
  return httpClient;
}

/**
 * Clients for reads that are the same for every visitor and cached across
 * them (branding, disclaimers, the sitemap). They must not read cookies, which
 * a cache scope forbids, and need no grant: those endpoints answer a closed
 * store, and a closed store's sitemap lists no products.
 */
export function getSharedClient(): StadianClient {
  if (!sharedClient) sharedClient = new StadianClient(getConfig());
  return sharedClient;
}

export function getSharedHttpClient(): HttpClient {
  if (!sharedHttpClient) sharedHttpClient = new HttpClient(getConfig());
  return sharedHttpClient;
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
  return new StadianClient({
    ...getConfig(),
    clientIp: await getVisitorIp(),
    requestHeaders: previewGrantHeaders,
  });
}

/** Low-level counterpart of getVisitorClient, for endpoints without a resource. */
export async function getVisitorHttpClient(
  options: { maxRetries?: number } = {},
): Promise<HttpClient> {
  return new HttpClient({
    ...getConfig(),
    ...options,
    clientIp: await getVisitorIp(),
    requestHeaders: previewGrantHeaders,
  });
}

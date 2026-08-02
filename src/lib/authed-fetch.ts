import { redirect } from "next/navigation";
import { StadianAuthError } from "@stadian/storefront-sdk";
import { getCustomerToken, getValidCustomerToken } from "./customer-token";

/**
 * Graceful handling for API calls made with the visitor's customer token.
 *
 * A stale session must never crash a render: the proxy refreshes near-expiry
 * tokens on page loads, but a token can still die between refreshes (revoked
 * server-side, refresh raced, clock skew). These wrappers are the single place
 * that decides what happens when the API says 401.
 */

export function loginRedirectUrl(redirectPath: string, expired: boolean): string {
  const params = new URLSearchParams({ redirect: redirectPath });
  if (expired) params.set("reason", "expired");
  return `/login?${params.toString()}`;
}

/**
 * Public surfaces (catalog, cart): run the fetch as the signed-in buyer when
 * possible; if the token turns out to be stale, retry the same call signed
 * out. B2B stores then respond with hidden prices, which the existing
 * "Sign in for pricing" UI already renders.
 */
export async function fetchWithOptionalAuth<T>(
  fetcher: (customerToken: string | undefined) => Promise<T>
): Promise<T> {
  const token = await getValidCustomerToken();
  try {
    return await fetcher(token);
  } catch (err) {
    if (token !== undefined && err instanceof StadianAuthError) {
      return fetcher(undefined);
    }
    throw err;
  }
}

/**
 * Account-only surfaces: a missing or stale session sends the visitor to
 * /login with a return path (and `reason=expired` when they had a session
 * that lapsed). Non-auth errors propagate untouched.
 *
 * Server components only — `redirect()` here throws NEXT_REDIRECT, so callers
 * must not catch errors around this without rethrowing unknown ones.
 */
export async function fetchWithRequiredAuth<T>(
  redirectPath: string,
  fetcher: (customerToken: string) => Promise<T>
): Promise<T> {
  const rawToken = await getCustomerToken();
  const token = await getValidCustomerToken();
  if (!token) redirect(loginRedirectUrl(redirectPath, Boolean(rawToken)));
  try {
    return await fetcher(token);
  } catch (err) {
    if (err instanceof StadianAuthError) {
      redirect(loginRedirectUrl(redirectPath, true));
    }
    throw err;
  }
}

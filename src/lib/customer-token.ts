import { cookies } from "next/headers";
import { TOKEN_COOKIE } from "./auth-cookies";
import { isTokenExpired } from "./jwt-expiry";

export { TOKEN_COOKIE };

/**
 * The signed-in buyer's access token cookie, if any — including one that has
 * already expired. Prefer {@link getValidCustomerToken} for anything that will
 * present the token to the API or treat its presence as "signed in".
 */
export async function getCustomerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value;
}

/**
 * The buyer's access token only while it is still live.
 *
 * Wholesale stores (`hide_prices_until_login`) return null prices and closed
 * carts to anonymous callers, so every catalog/cart request made on behalf of
 * a visitor must carry this when it exists. An expired token is worse than no
 * token — the API 401s instead of degrading to public data — so it is treated
 * as signed out here. (The proxy refreshes near-expiry tokens on page loads;
 * by the time this runs the cookie is either fresh or the session is gone.)
 */
export async function getValidCustomerToken(): Promise<string | undefined> {
  const token = await getCustomerToken();
  if (!token || isTokenExpired(token)) return undefined;
  return token;
}

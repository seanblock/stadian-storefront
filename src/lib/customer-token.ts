import { cookies } from "next/headers";

export const TOKEN_COOKIE = "stadian_customer_token";

/**
 * The signed-in buyer's access token, if any.
 *
 * Wholesale stores (`hide_prices_until_login`) return null prices and closed
 * carts to anonymous callers, so every catalog/cart request made on behalf of a
 * visitor must carry this when it exists.
 */
export async function getCustomerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value;
}

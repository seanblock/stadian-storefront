/**
 * Minimal JWT payload inspection — decode only, never verify.
 *
 * This is scheduling, not security: the storefront uses `exp` to decide when
 * to refresh a session or stop presenting a token, while the API remains the
 * sole authority on whether a token is actually valid.
 */

/** The token's `exp` claim in epoch seconds, or null when unreadable. */
export function getJwtExpiry(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    // base64url → base64; atob is forgiving about missing padding.
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload: unknown = JSON.parse(json);
    if (
      typeof payload === "object" &&
      payload !== null &&
      "exp" in payload &&
      typeof (payload as { exp: unknown }).exp === "number"
    ) {
      return (payload as { exp: number }).exp;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * True when the token's `exp` is in the past (or within `skewSeconds` of it).
 *
 * Tokens without a readable expiry are treated as NOT expired — we can't
 * schedule around them, so the API's 401 (handled gracefully downstream) is
 * the fallback.
 */
export function isTokenExpired(
  token: string,
  skewSeconds = 0,
  nowMs: number = Date.now()
): boolean {
  const exp = getJwtExpiry(token);
  if (exp === null) return false;
  return exp * 1000 <= nowMs + skewSeconds * 1000;
}

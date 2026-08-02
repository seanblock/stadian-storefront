/**
 * Customer auth cookie names and options, shared by the login/refresh server
 * actions and the proxy (the only place cookies can be written on page loads).
 * Keeping them in one module stops the two writers from drifting apart.
 */

export const TOKEN_COOKIE = "stadian_customer_token";
export const REFRESH_TOKEN_COOKIE = "stadian_refresh_token";

export const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

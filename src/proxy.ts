import { NextRequest, NextResponse } from "next/server";
import {
  TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  TOKEN_COOKIE_MAX_AGE,
  REFRESH_COOKIE_MAX_AGE,
  authCookieOptions,
} from "@/lib/auth-cookies";
import { isTokenExpired } from "@/lib/jwt-expiry";

const protectedPaths = ["/account", "/rep"];

/** Refresh this many seconds before the access token actually expires. */
const REFRESH_SKEW_SECONDS = 60;

type RefreshOutcome =
  | { status: "rotated"; accessToken: string; refreshToken?: string }
  /** The refresh token is dead — the session is over. */
  | { status: "invalid" }
  /** Couldn't reach the API — keep the cookies and let downstream degrade. */
  | { status: "transient" };

/**
 * Refresh-token rotation is strict: a token dies the moment it is used, so two
 * parallel page requests must never both call refresh. This per-process memo
 * shares one in-flight call between every request carrying the same refresh
 * token, and keeps the outcome for a short window so a straggler that arrives
 * with the already-rotated token reuses the result instead of burning a dead
 * token (which would log the customer out). Separate server instances can
 * still race in theory; the failure mode is a clean sign-out, never a crash.
 */
const REFRESH_MEMO_TTL_MS = 10_000;
let lastRefresh: {
  refreshToken: string;
  promise: Promise<RefreshOutcome>;
  at: number;
} | null = null;

function refreshOnce(refreshToken: string): Promise<RefreshOutcome> {
  const now = Date.now();
  if (
    lastRefresh &&
    lastRefresh.refreshToken === refreshToken &&
    now - lastRefresh.at < REFRESH_MEMO_TTL_MS
  ) {
    return lastRefresh.promise;
  }
  const promise = callRefresh(refreshToken);
  lastRefresh = { refreshToken, promise, at: now };
  return promise;
}

/**
 * Direct fetch rather than the SDK client: the SDK retries 3× with 10s
 * timeouts, which could wedge every page load behind a slow API. One attempt,
 * short timeout — if it fails transiently the page renders signed-out-ish and
 * the next request tries again.
 */
async function callRefresh(refreshToken: string): Promise<RefreshOutcome> {
  const baseUrl = process.env.STADIAN_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.STADIAN_API_KEY;
  if (!baseUrl || !apiKey) return { status: "transient" };

  try {
    // Same route the SDK's customers.refreshToken uses (HttpClient prepends
    // /v1/storefront to every path).
    const res = await fetch(`${baseUrl}/v1/storefront/customers/refresh`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data: unknown = await res.json().catch(() => null);
      const body = data as { access_token?: unknown; refresh_token?: unknown } | null;
      if (body && typeof body.access_token === "string") {
        return {
          status: "rotated",
          accessToken: body.access_token,
          refreshToken:
            typeof body.refresh_token === "string" ? body.refresh_token : undefined,
        };
      }
      // 2xx with an unexpected shape — don't destroy the session over it.
      return { status: "transient" };
    }

    // 4xx = the refresh token was rejected; anything else is API trouble.
    return res.status >= 400 && res.status < 500
      ? { status: "invalid" }
      : { status: "transient" };
  } catch {
    return { status: "transient" };
  }
}

type AuthCookieAction =
  | { action: "none" }
  | { action: "set"; accessToken: string; refreshToken?: string }
  | { action: "clear" };

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const accessToken = request.cookies.get(TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // Silent session refresh. This is the only place cookies can be written on
  // page loads (server components cannot set cookies), so expired sessions are
  // repaired — or cleanly torn down — here, before anything renders.
  let auth: AuthCookieAction = { action: "none" };
  const accessMissingOrStale =
    !accessToken || isTokenExpired(accessToken, REFRESH_SKEW_SECONDS);

  if (accessMissingOrStale && (accessToken || refreshToken)) {
    if (refreshToken) {
      const outcome = await refreshOnce(refreshToken);
      if (outcome.status === "rotated") {
        auth = {
          action: "set",
          accessToken: outcome.accessToken,
          refreshToken: outcome.refreshToken,
        };
      } else if (outcome.status === "invalid") {
        auth = { action: "clear" };
      }
      // transient: keep cookies; downstream falls back gracefully.
    } else {
      // Expired access token and nothing to refresh with: signed out.
      auth = { action: "clear" };
    }
  }

  // Mirror the outcome onto the request so this render's `cookies()` sees it.
  if (auth.action === "set") {
    request.cookies.set(TOKEN_COOKIE, auth.accessToken);
    if (auth.refreshToken) {
      request.cookies.set(REFRESH_TOKEN_COOKIE, auth.refreshToken);
    }
  } else if (auth.action === "clear") {
    request.cookies.delete(TOKEN_COOKIE);
    request.cookies.delete(REFRESH_TOKEN_COOKIE);
  }

  const applyAuthCookies = (response: NextResponse) => {
    if (auth.action === "set") {
      response.cookies.set(
        TOKEN_COOKIE,
        auth.accessToken,
        authCookieOptions(TOKEN_COOKIE_MAX_AGE)
      );
      if (auth.refreshToken) {
        response.cookies.set(
          REFRESH_TOKEN_COOKIE,
          auth.refreshToken,
          authCookieOptions(REFRESH_COOKIE_MAX_AGE)
        );
      }
    } else if (auth.action === "clear") {
      response.cookies.delete(TOKEN_COOKIE);
      response.cookies.delete(REFRESH_TOKEN_COOKIE);
    }
    return response;
  };

  // Protected route check
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !request.cookies.get(TOKEN_COOKIE)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    // They had a session and it just died — say so on the login page.
    if (auth.action === "clear") loginUrl.searchParams.set("reason", "expired");
    return applyAuthCookies(NextResponse.redirect(loginUrl));
  }

  const response = NextResponse.next({ request: { headers: request.headers } });

  // Capture referral code from ?ref= param (Task 13)
  const ref = searchParams.get("ref");
  if (ref && !request.cookies.get("stadian_ref")) {
    response.cookies.set("stadian_ref", ref, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return applyAuthCookies(response);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

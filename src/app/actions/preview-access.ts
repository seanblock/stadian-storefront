"use server";

import { cookies } from "next/headers";
import { StadianError } from "@stadian/storefront-sdk";
import { getVisitorHttpClient } from "@/lib/stadian";
import {
  PREVIEW_COOKIE,
  PREVIEW_GRANT_COOKIE,
  PREVIEW_MAX_AGE,
  hasPreviewSecret,
  makePreviewToken,
} from "@/lib/preview-access";

/**
 * Why an unlock failed, so the visitor is never told "incorrect password" for
 * something else:
 * - `invalid`: wrong password.
 * - `unavailable`: the password may well be right, but no grant can be issued
 *   (this deployment has no signing secret, or the API sent none).
 * - `busy`: too many guesses at this store lately; the API refuses every
 *   attempt until the window passes, right password included.
 * - `error`: the API couldn't be reached or failed; try again.
 */
export type PreviewUnlockFailure = "invalid" | "unavailable" | "busy" | "error";

export type PreviewUnlockResult = { ok: true } | { ok: false; reason: PreviewUnlockFailure };

function previewCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

/**
 * Verify a storefront preview password against the backend. On success, set
 * two cookies for this visitor's browser only: a signed token that unlocks the
 * closed store's pages, and the API's grant, which the storefront sends back on
 * every API request so the API serves the closed store too.
 */
export async function submitPreviewPassword(
  password: string
): Promise<PreviewUnlockResult> {
  const trimmed = password.trim();
  if (!trimmed) return { ok: false, reason: "invalid" };

  // Checked before the password is verified, never after: branching on the
  // secret only once we know the password was right would tell an attacker
  // when they had guessed it, on a deployment that grants nothing either way.
  if (!hasPreviewSecret()) {
    console.error(
      "[preview-access] No signing secret is set (STOREFRONT_PREVIEW_SECRET " +
        "or STADIAN_API_KEY) — preview grants cannot be issued."
    );
    return { ok: false, reason: "unavailable" };
  }

  let grant: string | null = null;
  let grantExpiresAt: number | null = null;
  try {
    // Per visitor, so the API's limit on password guesses applies to each
    // guesser. No retries: each one is another guess, and on a 429 the SDK
    // would sit out Retry-After while the visitor watches a spinner.
    const res = await (await getVisitorHttpClient({ maxRetries: 0 })).request<{
      ok: boolean;
      grant?: string | null;
      expires_at?: number | null;
    }>("POST", "/access", { body: { password: trimmed } });
    if (res?.ok !== true) return { ok: false, reason: "invalid" };
    grant = res.grant ?? null;
    grantExpiresAt = res.expires_at ?? null;
  } catch (err) {
    if (err instanceof StadianError && err.status === 429) return { ok: false, reason: "busy" };
    if (err instanceof StadianError && (err.status === 0 || err.status >= 500)) {
      return { ok: false, reason: "error" };
    }
    return { ok: false, reason: "invalid" };
  }
  // The API only serves a closed store to requests carrying its grant, so a
  // right password without one can't unlock anything.
  if (!grant) return { ok: false, reason: "unavailable" };

  const now = Math.floor(Date.now() / 1000);
  const grantMaxAge = grantExpiresAt
    ? Math.min(PREVIEW_MAX_AGE, grantExpiresAt - now)
    : PREVIEW_MAX_AGE;
  // Already expired by our clock (skew): a cookie with no life would leave the
  // visitor "unlocked" here and refused by the API.
  if (grantMaxAge <= 0) return { ok: false, reason: "error" };

  // Unreachable given the secret check above; a null here would mean the
  // secret was removed mid-request, so fail closed as an ordinary rejection
  // rather than reporting anything back about the password.
  const token = makePreviewToken(now + PREVIEW_MAX_AGE);
  if (!token) return { ok: false, reason: "invalid" };

  const cookieStore = await cookies();
  cookieStore.set(PREVIEW_COOKIE, token, previewCookieOptions(PREVIEW_MAX_AGE));
  cookieStore.set(PREVIEW_GRANT_COOKIE, grant, previewCookieOptions(grantMaxAge));

  return { ok: true };
}

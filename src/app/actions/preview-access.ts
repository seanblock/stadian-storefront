"use server";

import { cookies } from "next/headers";
import { getHttpClient } from "@/lib/stadian";
import {
  PREVIEW_COOKIE,
  PREVIEW_MAX_AGE,
  hasPreviewSecret,
  makePreviewToken,
} from "@/lib/preview-access";

export type PreviewUnlockResult =
  /** `unavailable` = the password may well be right, but this deployment has no
      signing secret, so no grant can be issued. Telling the visitor "incorrect
      password" there sends them hunting for the wrong problem. */
  { ok: true } | { ok: false; reason: "invalid" | "unavailable" };

/**
 * Verify a storefront preview password against the backend. On success, set a
 * signed cookie that unlocks the closed store for this visitor's browser only.
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

  let ok = false;
  try {
    const res = await getHttpClient().request<{ ok: boolean }>(
      "POST",
      "/access",
      { body: { password: trimmed } }
    );
    ok = res?.ok === true;
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (!ok) return { ok: false, reason: "invalid" };

  const expiresAt = Math.floor(Date.now() / 1000) + PREVIEW_MAX_AGE;
  // Unreachable given the check above; a null here would mean the secret was
  // removed mid-request, so fail closed as an ordinary rejection rather than
  // reporting anything back about the password.
  const token = makePreviewToken(expiresAt);
  if (!token) return { ok: false, reason: "invalid" };

  const cookieStore = await cookies();
  cookieStore.set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PREVIEW_MAX_AGE,
    path: "/",
  });

  return { ok: true };
}

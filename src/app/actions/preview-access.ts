"use server";

import { cookies } from "next/headers";
import { getHttpClient } from "@/lib/stadian";
import {
  PREVIEW_COOKIE,
  PREVIEW_MAX_AGE,
  makePreviewToken,
} from "@/lib/preview-access";

/**
 * Verify a storefront preview password against the backend. On success, set a
 * signed cookie that unlocks the closed store for this visitor's browser only.
 */
export async function submitPreviewPassword(
  password: string
): Promise<{ ok: boolean }> {
  const trimmed = password.trim();
  if (!trimmed) return { ok: false };

  let ok = false;
  try {
    const res = await getHttpClient().request<{ ok: boolean }>(
      "POST",
      "/access",
      { body: { password: trimmed } }
    );
    ok = res?.ok === true;
  } catch {
    return { ok: false };
  }

  if (!ok) return { ok: false };

  const expiresAt = Math.floor(Date.now() / 1000) + PREVIEW_MAX_AGE;
  const token = makePreviewToken(expiresAt);
  if (!token) return { ok: false };

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

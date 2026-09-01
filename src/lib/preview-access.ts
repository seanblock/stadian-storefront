import crypto from "node:crypto";

// When the storefront is closed, a visitor who enters the tenant's preview
// password is granted access for their own browser only. We record that grant
// as a signed cookie so it cannot be forged just by setting a plain cookie
// value. The signing secret lives only on the server.
//
// The password is verified against the backend (see actions/preview-access);
// this module only mints/validates the *unlock token* that proves a successful
// verification.

export const PREVIEW_COOKIE = "sf_preview_access";

// 30 days — a preview grant is a convenience, not a security boundary.
export const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret(): string {
  // A dedicated secret if provided, else fall back to the server-only API key
  // (never exposed to the browser). Either way the token is unforgeable client
  // side. If neither exists we cannot sign — treat as no access.
  return process.env.STOREFRONT_PREVIEW_SECRET || process.env.STADIAN_API_KEY || "";
}

/**
 * Whether this deployment can issue grants at all. Callers check this BEFORE
 * verifying a password: deciding afterwards would make the response depend on
 * whether the guess was right, turning a misconfigured deployment into an
 * oracle that confirms a correct password while refusing access.
 */
export function hasPreviewSecret(): boolean {
  return getSecret() !== "";
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/** Mint a signed unlock token valid until `expiresAt` (epoch seconds). */
export function makePreviewToken(expiresAtSeconds: number): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const payload = `v1.${expiresAtSeconds}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Validate a token: correct signature and not expired. */
export function verifyPreviewToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expStr, sig] = parts;
  if (version !== "v1") return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;

  const expected = sign(`${version}.${expStr}`, secret);
  // Compare in constant time; guard against length mismatch (throws otherwise).
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

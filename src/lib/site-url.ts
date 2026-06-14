/**
 * Canonical site URL for SEO (sitemap, robots, canonical links, Open Graph).
 *
 * Each cloned store should set NEXT_PUBLIC_SITE_URL to its real domain (e.g.
 * https://elemental-peptides.com) — that becomes the canonical/OG host.
 *
 * Resolution order (never throws, so it can't break a build):
 *   1. NEXT_PUBLIC_SITE_URL — the configured production domain.
 *   2. VERCEL_URL — the per-deployment Vercel host (correct for preview
 *      deploys; also a safe prod fallback if the env var was forgotten).
 *   3. localhost — local dev.
 *
 * The point is to NEVER emit a placeholder like example.com into the sitemap /
 * robots / canonicals, which actively harms indexing.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3003";
}

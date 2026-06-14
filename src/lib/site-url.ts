/**
 * Canonical site URL for SEO (sitemap, robots, canonical links, Open Graph).
 *
 * Every cloned store MUST set NEXT_PUBLIC_SITE_URL (e.g.
 * https://elemental-peptides.com). In production we fail loudly when it is
 * missing — that is far safer than silently emitting placeholder URLs into the
 * sitemap, robots.txt, and canonical/OG tags (which actively harms indexing).
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set in production — it drives canonical URLs, the sitemap, robots.txt, and Open Graph tags.",
    );
  }
  return "http://localhost:3003";
}

import { MetadataRoute } from "next";
import { getSharedClient } from "@/lib/stadian";
import { getBrandingState } from "@/lib/branding";
import { getContactDetails } from "@/lib/contact-details";
import { getSiteUrl } from "@/lib/site-url";
import { isCatalogPublic } from "@/lib/store-access";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
  // /contact is a 404 until the store publishes contact details. getBranding's
  // 30s cache also makes this route refresh, so no redeploy is needed.
  const { branding, isFallback } = await getBrandingState();
  if (getContactDetails(branding)) {
    staticPages.push({ url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.4 });
  }

  // Product URLs name the products, so a gated or closed store doesn't list them.
  if (!isCatalogPublic(branding, isFallback)) return staticPages;

  // Product pages
  try {
    const client = getSharedClient();
    const products = await client.catalog.list({ limit: 100 });
    const productPages: MetadataRoute.Sitemap = products.items.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}

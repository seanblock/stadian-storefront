import type { Metadata } from "next";
import type { StorefrontCategory, StorefrontProduct } from "@stadian/storefront-sdk";
import { getBranding } from "@/lib/branding";
import { getStadianClient } from "@/lib/stadian";
import { Hero } from "@/components/home/hero";
import { MarqueeStrip } from "@/components/home/marquee-strip";
import { FeaturedEdit } from "@/components/home/featured-edit";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { ClosingStatement } from "@/components/home/closing-statement";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  const name = branding.store_name || "Store";
  return {
    // Home shows the store name as-is (not "Home | Store").
    title: { absolute: name },
    description: branding.tagline || `Shop ${name}.`,
    alternates: { canonical: "/" },
  };
}

export default async function Home() {
  const branding = await getBranding();

  let featuredProducts: StorefrontProduct[] = [];
  try {
    const client = getStadianClient();
    const result = await client.catalog.list({ page: 1, limit: 9 });
    featuredProducts = result.items;
  } catch {
    // Fall through — sections gracefully hide when empty
  }

  // Derive unique categories from featured product set
  const seen = new Set<string>();
  const categories: StorefrontCategory[] = [];
  for (const product of featuredProducts) {
    for (const cat of product.categories ?? []) {
      if (!seen.has(cat.slug)) {
        seen.add(cat.slug);
        categories.push(cat);
      }
    }
  }

  const heroFeature =
    featuredProducts.find((p) => p.image_url) ??
    featuredProducts[0] ??
    null;

  return (
    <>
      <Hero branding={branding} featuredImage={heroFeature} />
      <MarqueeStrip />
      <FeaturedEdit products={featuredProducts} />
      <CategoriesGrid categories={categories} />
      <ClosingStatement branding={branding} />
    </>
  );
}

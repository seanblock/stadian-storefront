import Link from "next/link";
import { getBranding } from "@/lib/branding";
import { getStadianClient } from "@/lib/stadian";
import { ProductGrid } from "@/components/products/product-grid";

export default async function Home() {
  const branding = await getBranding();

  let featuredProducts: import("@stadian/storefront-sdk").StorefrontProduct[] = [];
  try {
    const client = getStadianClient();
    const result = await client.catalog.list({ page: 1, limit: 8 });
    featuredProducts = result.items;
  } catch {
    // Fall through — grid renders empty state
  }

  const storeName = branding.store_name || "Store";
  const tagline = branding.tagline || "Quality products delivered to your door.";

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {storeName}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">{tagline}</p>
          <Link
            href="/products"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Browse Products
          </Link>
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Featured Products
            </h2>
            <Link
              href="/products"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </section>
      )}
    </>
  );
}

import { getStadianClient } from "@/lib/stadian";
import { fetchWithOptionalAuth } from "@/lib/authed-fetch";
import { ProductCard } from "@/components/products/product-card";

interface RelatedProductsProps {
  currentProductId: string;
  categories: { slug: string }[];
}

export async function RelatedProducts({
  currentProductId,
  categories,
}: RelatedProductsProps) {
  const client = getStadianClient();
  // Stale session → retry signed-out rather than crash the product page.
  const { items: products } = await fetchWithOptionalAuth((customerToken) =>
    client.catalog.list({ limit: 50, customerToken })
  );

  const categorySlugs = new Set(categories.map((c) => c.slug));

  const related = products
    .filter(
      (product) =>
        product.id !== currentProductId &&
        product.categories?.some((cat) => categorySlugs.has(cat.slug))
    )
    .slice(0, 4);

  if (related.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 border-t pt-10">
      <h2 className="text-lg font-semibold">Also in this category</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

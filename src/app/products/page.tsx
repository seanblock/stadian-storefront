import Link from "next/link";
import { getStadianClient } from "@/lib/stadian";
import { ProductCard } from "@/components/products/product-card";
import { ProductGroupCard } from "@/components/products/product-group-card";
import { Input } from "@/components/ui/input";
import type {
  StorefrontProduct,
  StorefrontProductGroup,
  StorefrontCategory,
} from "@stadian/storefront-sdk";

const PAGE_SIZE = 12;

interface ProductsPageProps {
  searchParams: Promise<{ search?: string; page?: string; category?: string }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const category = params.category ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  let products: StorefrontProduct[] = [];
  let total = 0;
  let productGroups: StorefrontProductGroup[] = [];
  const allCategories: StorefrontCategory[] = [];

  try {
    const client = getStadianClient();

    // Fetch products and product groups in parallel
    const [catalogResult, groupsResult] = await Promise.all([
      client.catalog.list({ page: 1, limit: 100, search: search || undefined }),
      client.productGroups.list(),
    ]);

    let allProducts = catalogResult.items;
    productGroups = groupsResult.items;

    // Extract unique categories from all products
    if (!search) {
      const seen = new Set<string>();
      for (const p of allProducts) {
        for (const cat of p.categories ?? []) {
          if (!seen.has(cat.slug)) {
            seen.add(cat.slug);
            allCategories.push(cat);
          }
        }
      }
      allCategories.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Filter by category client-side (backend filter is broken)
    if (category) {
      allProducts = allProducts.filter((p) =>
        p.categories?.some((c) => c.slug === category)
      );
      // Also filter product groups — keep only groups that have
      // at least one product in the selected category
      productGroups = productGroups.filter((g) =>
        g.products.some((p) =>
          p.categories?.some((c) => c.slug === category)
        )
      );
    }

    // Remove products that belong to a group — they'll show as group cards
    const groupedProductIds = new Set(
      productGroups.flatMap((g) => g.products.map((p) => p.id))
    );
    const ungroupedProducts = allProducts.filter(
      (p) => !groupedProductIds.has(p.id)
    );

    // Client-side pagination over ungrouped products
    total = ungroupedProducts.length;
    products = ungroupedProducts.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE
    );
  } catch (err) {
    // Log so failures are observable; page renders the empty state below.
    console.error("Failed to load catalog:", err);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function buildHref(p: number, overrides?: { category?: string }) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    const cat = overrides?.category ?? category;
    if (cat) qs.set("category", cat);
    if (p > 1) qs.set("page", String(p));
    const str = qs.toString();
    return `/products${str ? `?${str}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>

        {/* Search */}
        <form method="GET" action="/products" className="w-full sm:w-72">
          <Input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search products…"
            className="h-9"
          />
        </form>
      </div>

      {/* Category filters */}
      {allCategories.length > 0 && !search && (
        <div className="mb-8 flex flex-wrap gap-1.5">
          <Link
            href="/products"
            className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-all ${
              !category
                ? "border-foreground bg-foreground text-background shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            All
          </Link>
          {allCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={buildHref(1, { category: cat.slug })}
              className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-all ${
                category === cat.slug
                  ? "border-foreground bg-foreground text-background shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Unified grid: group cards + ungrouped product cards */}
      {productGroups.length === 0 && products.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productGroups.map((group) => (
            <ProductGroupCard key={group.id} group={group} />
          ))}
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          {hasPrev ? (
            <Link
              href={buildHref(page - 1)}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium opacity-40">
              Previous
            </span>
          )}

          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          {hasNext ? (
            <Link
              href={buildHref(page + 1)}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium opacity-40">
              Next
            </span>
          )}
        </div>
      )}
    </div>
  );
}

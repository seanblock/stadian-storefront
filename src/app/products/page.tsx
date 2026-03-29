import Link from "next/link";
import { getStadianClient } from "@/lib/stadian";
import { ProductGrid } from "@/components/products/product-grid";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 12;

interface ProductsPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  let result = { items: [] as import("@stadian/storefront-sdk").StorefrontProduct[], total: 0, page: 1, limit: PAGE_SIZE };

  try {
    const client = getStadianClient();
    result = await client.catalog.list({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
    });
  } catch {
    // Silently fall through — ProductGrid renders "No products found"
  }

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function buildHref(p: number) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    qs.set("page", String(p));
    return `/products?${qs.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Grid */}
      <ProductGrid products={result.items} />

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

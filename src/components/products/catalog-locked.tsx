/** Stands in for catalog pages when the visitor can't see products. */
export function CatalogLocked({ unavailable }: { unavailable: boolean }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Products</h1>
      <p className="mt-6 text-muted-foreground">
        {unavailable
          ? "The catalog is temporarily unavailable. Please try again in a moment."
          : "Confirm your age to view the catalog."}
      </p>
    </div>
  );
}

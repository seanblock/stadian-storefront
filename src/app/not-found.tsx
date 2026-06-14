import Link from "next/link";

/**
 * Friendly 404 — rendered for unmatched routes and any `notFound()` call
 * (e.g. an unknown product slug) instead of a bare Next.js default.
 *
 * This is a Server Component, so it must NOT call the client-only
 * `buttonVariants()`; the link is styled with plain utility classes instead.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to store
      </Link>
    </div>
  );
}

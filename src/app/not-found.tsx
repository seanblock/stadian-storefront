import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * Friendly 404 — rendered for unmatched routes and any `notFound()` call
 * (e.g. an unknown product slug) instead of a bare Next.js default.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back to store
      </Link>
    </div>
  );
}

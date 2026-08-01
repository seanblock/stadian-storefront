import Link from "next/link";

// Server Component: it must NOT call the client-only `buttonVariants()`, so the
// links are styled with plain utility classes (same approach as not-found.tsx).
const PRIMARY_LINK =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";
const OUTLINE_LINK =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted";

/**
 * Stands in for the price on a wholesale store when the visitor is signed out.
 * `variant="inline"` fits a product card; `variant="panel"` replaces the
 * add-to-cart block on a product page.
 */
export function SignInForPricing({
  redirectTo,
  variant = "inline",
}: {
  redirectTo?: string;
  variant?: "inline" | "panel";
}) {
  const href = redirectTo
    ? `/login?redirect=${encodeURIComponent(redirectTo)}`
    : "/login";

  if (variant === "inline") {
    return (
      <p className="text-sm font-semibold text-muted-foreground">
        Sign in to see pricing
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5">
      <p className="text-sm font-semibold text-foreground">
        Pricing is for account holders
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to your wholesale account to see pricing and place an order.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={href} className={PRIMARY_LINK}>
          Sign in
        </Link>
        <Link href="/register" className={OUTLINE_LINK}>
          Apply for an account
        </Link>
      </div>
    </div>
  );
}

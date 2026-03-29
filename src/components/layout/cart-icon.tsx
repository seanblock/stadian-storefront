"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export function CartIcon() {
  return (
    <Link
      href="/cart"
      aria-label="Shopping cart"
      className="relative inline-flex items-center justify-center rounded-lg p-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
    >
      <ShoppingCart className="size-5" />
    </Link>
  );
}

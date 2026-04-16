import Link from "next/link";
import Image from "next/image";
import type { StorefrontBranding } from "@stadian/storefront-sdk";
import { CartIcon } from "./cart-icon";
import { AuthNav } from "./auth-nav";
import { MobileNav } from "./mobile-nav";

interface HeaderProps {
  branding: StorefrontBranding;
}

export function Header({ branding }: HeaderProps) {
  const storeName = branding.store_name || "Store";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu + Logo + Store Name */}
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link href="/" className="flex items-center gap-2">
            {branding.logo_url ? (
              <Image
                src={branding.logo_url}
                alt={storeName}
                width={32}
                height={32}
                className="size-8 rounded object-contain"
              />
            ) : null}
            <span className="text-lg font-semibold tracking-tight">
              {storeName}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-3">
          <Link
            href="/products"
            className="hidden md:inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            Products
          </Link>
          <Link
            href="/about"
            className="hidden md:inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            About
          </Link>
          <Link
            href="/faq"
            className="hidden md:inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            FAQ
          </Link>
          <AuthNav />
          <CartIcon />
        </nav>
      </div>
    </header>
  );
}

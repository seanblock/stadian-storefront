"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { StorefrontBranding } from "@stadian/storefront-sdk";
import { CartIcon } from "./cart-icon";
import { AuthNav } from "./auth-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  branding: StorefrontBranding;
}

const NAV_LINKS = [
  { href: "/products", label: "Catalog" },
  { href: "/about", label: "Science" },
  { href: "/faq", label: "Journal" },
] as const;

const GOLD = "#d4a951";

export function Header({ branding }: HeaderProps) {
  const storeName = branding.store_name || "Store";
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const transparent = isHome && !scrolled;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        transparent
          ? "bg-transparent text-[#f3ead5]"
          : "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:h-[5.5rem] sm:px-6 lg:px-8">
        {/* ===== LEFT — Logo + wordmark + tagline ===== */}
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative inline-flex">
              <Image
                src="/logo.png"
                alt={storeName}
                width={44}
                height={44}
                priority
                className="size-10 object-contain transition-transform duration-700 group-hover:rotate-[4deg] sm:size-11"
              />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-[15px] font-bold tracking-[-0.01em]">
                {storeName}
              </span>
              <span
                className={`mt-1 font-serif text-[10.5px] italic tracking-[0.12em] ${
                  transparent
                    ? "text-[#d4a951]"
                    : "text-[#8a6516] dark:text-[#d4a951]"
                }`}
              >
                Research-grade · Est. 2026
              </span>
            </span>
          </Link>
        </div>

        {/* ===== CENTER — Nav with hairline underlines ===== */}
        <nav className="hidden items-center md:flex">
          {NAV_LINKS.map((item, i) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              isActive={pathname === item.href}
              isFirst={i === 0}
              transparent={transparent}
            />
          ))}
        </nav>

        {/* ===== RIGHT — Utility cluster ===== */}
        <div className="flex items-center">
          {/* Vertical hairline divider — only shown when not transparent */}
          <span
            aria-hidden
            className={`mr-3 hidden h-6 w-px transition-opacity duration-500 sm:block ${
              transparent ? "opacity-30" : "opacity-20"
            }`}
            style={{ background: transparent ? GOLD : "currentColor" }}
          />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <span aria-hidden className="hidden h-4 w-px opacity-15 sm:block bg-current" />
            <AuthNav />
            <span aria-hidden className="hidden h-4 w-px opacity-15 sm:block bg-current" />
            <CartIcon />
          </div>
        </div>
      </div>

      {/* Hairline at bottom — gold when transparent (subtle architectural rule), invisible when solid (border-b handles it) */}
      {transparent && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${GOLD}40, transparent)`,
          }}
        />
      )}
    </header>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  isFirst: boolean;
  transparent: boolean;
}

function NavLink({ href, label, isActive, isFirst, transparent }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center px-4 py-2 text-[11px] font-medium uppercase tracking-[0.24em] transition-opacity duration-300"
    >
      {/* Gold dot prefix — visible on hover or active */}
      <span
        aria-hidden
        className={`mr-2 inline-block size-1 rounded-full transition-all duration-500 ${
          isActive
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100"
        }`}
        style={{ background: GOLD }}
      />
      <span
        className={`transition-colors duration-300 ${
          isActive ? "opacity-100" : "opacity-75 group-hover:opacity-100"
        }`}
      >
        {label}
      </span>
      {/* Animated hairline underline */}
      <span
        aria-hidden
        className={`absolute inset-x-4 -bottom-1 h-px origin-left transition-transform duration-500 ${
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
        style={{ background: GOLD }}
      />
      {/* Tick marker at top for first item — adds editorial detail */}
      {isFirst && (
        <span
          aria-hidden
          className="absolute -top-0.5 left-4 h-1.5 w-px opacity-40"
          style={{ background: transparent ? GOLD : "currentColor" }}
        />
      )}
    </Link>
  );
}

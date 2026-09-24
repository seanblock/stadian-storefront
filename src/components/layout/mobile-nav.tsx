"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAVY = "#0a1a2e";
const CREAM = "#f3ead5";
const CREAM_DIM = "#b8b0a0";
const GOLD = "#d4a951";

const navLinks = [
  { href: "/products", label: "Catalog" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

// The same four the hero leads with — a drawer that opens to three grey links
// and 900px of nothing is a wasted screen, and these are the reasons to buy.
const TRUST_POINTS = [
  "Third-party tested",
  "Batch-numbered",
  "Sealed in-house",
  "Free shipping on orders $400+",
] as const;

interface MobileNavProps {
  /** Tenant's store name — never hardcode a brand into a shared component. */
  storeName: string;
  /** Hide the cart entirely when this visitor may not have one. */
  cartEnabled?: boolean;
}

export function MobileNav({ storeName, cartEnabled = true }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { customer, isAuthenticated, isSalesRep, logout, loading } = useAuth();
  const { cart, setDrawerOpen } = useCart();

  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu className="size-5" />
        <span className="sr-only">Menu</span>
      </SheetTrigger>

      <SheetContent
        side="left"
        showCloseButton={false}
        className="grain w-[86vw] max-w-[21rem] gap-0 overflow-y-auto border-0 p-0"
        style={{ backgroundColor: NAVY, color: CREAM }}
      >
        {/* Required for the dialog's accessible name; the brand block below is
            the visible heading, so this stays off-screen rather than repeating
            the word "Navigation" at the user. */}
        <SheetTitle className="sr-only">Navigation</SheetTitle>

        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full opacity-40 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${GOLD}44, transparent 70%)`,
          }}
        />

        <SheetClose
          render={
            <button
              type="button"
              aria-label="Close menu"
              className="absolute right-4 top-5 z-10 inline-flex size-9 items-center justify-center rounded-full border transition-colors"
              style={{ borderColor: `${CREAM}26`, color: CREAM }}
            />
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="size-4"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </SheetClose>

        <div className="relative z-10 flex min-h-full flex-col px-6 pb-8 pt-6">
          {/* Brand */}
          <Link href="/" onClick={close} className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
            />
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-bold tracking-[-0.01em]">
                {storeName}
              </span>
              <span
                className="mt-1 font-serif text-[10.5px] italic tracking-[0.12em]"
                style={{ color: GOLD }}
              >
                Est. 2026
              </span>
            </span>
          </Link>

          {/* Primary nav — the reason the drawer exists, so it gets the weight */}
          <nav className="mt-10 flex flex-col">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  aria-current={isActive ? "page" : undefined}
                  className="reveal-up group flex items-center justify-between border-b py-4 text-[15px] font-bold uppercase tracking-[0.2em] transition-opacity duration-300"
                  style={{
                    borderColor: `${CREAM}14`,
                    color: isActive ? GOLD : CREAM,
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className={`size-1.5 rounded-full transition-all duration-300 ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                      style={{ background: GOLD }}
                    />
                    {link.label}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="size-4 opacity-25 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </nav>

          {/* Account + cart — previously unreachable from the drawer at all */}
          {!loading && (
            <div className="mt-8 flex flex-col gap-3">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.28em]"
                style={{ color: GOLD }}
              >
                {isAuthenticated ? "Your account" : "Account"}
              </p>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    onClick={close}
                    className="text-sm"
                    style={{ color: CREAM }}
                  >
                    {customer?.first_name
                      ? `Signed in as ${customer.first_name}`
                      : "My account"}
                  </Link>
                  {isSalesRep && (
                    <Link
                      href="/rep"
                      onClick={close}
                      className="text-sm"
                      style={{ color: CREAM }}
                    >
                      Rep portal
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      logout();
                    }}
                    className="text-left text-sm"
                    style={{ color: CREAM_DIM }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={close}
                    className="inline-flex h-11 items-center justify-center rounded-full text-[11px] font-bold uppercase tracking-[0.22em]"
                    style={{ background: GOLD, color: NAVY }}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={close}
                    className="inline-flex h-11 items-center justify-center rounded-full border text-[11px] font-bold uppercase tracking-[0.22em]"
                    style={{ borderColor: `${CREAM}2e`, color: CREAM }}
                  >
                    Apply for an account
                  </Link>
                </>
              )}

              {cartEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    setDrawerOpen(true);
                  }}
                  className="mt-1 flex items-center justify-between text-sm"
                  style={{ color: CREAM }}
                >
                  <span>Cart</span>
                  <span
                    className="font-mono text-xs tabular-nums"
                    style={{ color: itemCount > 0 ? GOLD : CREAM_DIM }}
                  >
                    {String(itemCount).padStart(2, "0")}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Fills the dead space with the reasons to buy rather than padding.
              The rule makes the gap above read as a deliberate footer instead
              of the panel simply running out of content. */}
          <div
            aria-hidden
            className="mt-auto h-px w-10"
            style={{ background: `${GOLD}66` }}
          />
          <ul className="grid gap-2.5 pt-5">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-xs">
                <span
                  aria-hidden
                  className="size-1 shrink-0 rounded-full"
                  style={{ background: GOLD }}
                />
                <span style={{ color: CREAM_DIM }}>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

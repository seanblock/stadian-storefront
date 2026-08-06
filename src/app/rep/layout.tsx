"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { RepSaleProvider } from "@/providers/rep-sale-provider";
import { Skeleton } from "@/components/ui/skeleton";

const NAVY = "#0a1a2e";
const GOLD = "#d4a951";

const NAV_ITEMS = [
  { href: "/rep", label: "Dashboard" },
  { href: "/rep/new-sale", label: "New Sale" },
  { href: "/rep/customers", label: "Customers" },
  { href: "/rep/orders", label: "Orders" },
  { href: "/rep/commissions", label: "Commissions" },
];

/**
 * Full-screen POS shell: navy top bar with gold-underlined tabs, light work
 * area, no store chrome (ChromeGate hides header/footer/cart drawer under
 * /rep). The isSalesRep gate here is UX only — every rep API call is
 * permission-checked server-side.
 */
export default function RepLayout({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, isSalesRep, customer } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    // The proxy already bounces signed-out visitors to /login; this covers the
    // signed-in-but-not-a-rep case.
    if (isAuthenticated && !isSalesRep) router.replace("/account");
  }, [loading, isAuthenticated, isSalesRep, router]);

  if (loading || !isSalesRep) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/rep" ? pathname === "/rep" : pathname.startsWith(href);

  return (
    <RepSaleProvider>
      <div className="flex min-h-screen flex-col bg-[#f4f4f2]">
        <header
          className="sticky top-0 z-40 text-white"
          style={{ background: NAVY }}
        >
          <div className="flex h-16 items-center gap-6 px-4 sm:px-6">
            <Link href="/rep" className="flex items-baseline gap-2">
              <span className="font-serif text-xl tracking-tight">
                Rep Portal
              </span>
              <span
                className="hidden text-[10px] font-medium uppercase tracking-[0.24em] sm:inline"
                style={{ color: GOLD }}
              >
                Point of Sale
              </span>
            </Link>

            <nav className="ml-2 flex h-full flex-1 items-stretch gap-1 overflow-x-auto">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex min-w-fit items-center px-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-opacity sm:text-xs ${
                    isActive(item.href)
                      ? "opacity-100"
                      : "opacity-60 hover:opacity-90"
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                      style={{ background: GOLD }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <span className="hidden text-xs opacity-70 md:inline">
                {customer?.first_name || customer?.email}
              </span>
              <Link
                href="/"
                className="text-[11px] font-medium uppercase tracking-[0.18em] opacity-60 transition-opacity hover:opacity-100"
              >
                Exit to store ↗
              </Link>
            </div>
          </div>
        </header>

        {/* div, not <main> — the root layout already renders the page <main> */}
        <div className="flex-1">{children}</div>
      </div>
    </RepSaleProvider>
  );
}

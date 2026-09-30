"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { getTaxExemptionsEnabled } from "@/app/actions/branding";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/invoices", label: "Invoices" },
  { href: "/account/settings", label: "Settings" },
];

// Only on stores that tax by ship-to address (branding.tax_exemptions_enabled).
const taxExemptionNavItem = { href: "/account/tax-exemption", label: "Tax exemption" };

const affiliateNavItems = [
  { href: "/account/affiliate", label: "Affiliate Dashboard" },
  { href: "/account/affiliate/payouts", label: "Payouts" },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading, isAffiliate } = useAuth();
  const [taxExemptions, setTaxExemptions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTaxExemptionsEnabled()
      .then((on) => {
        if (!cancelled) setTaxExemptions(on);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const accountItems = taxExemptions ? [...baseNavItems, taxExemptionNavItem] : baseNavItems;
  const navItems = isAffiliate ? [...accountItems, ...affiliateNavItems] : accountItems;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row md:gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="flex flex-col gap-0.5">
                {navItems.map((item, index) => {
                  const isAffiliateSectionStart =
                    item.href === "/account/affiliate";
                  const isActive = pathname === item.href;

                  return (
                    <div key={item.href}>
                      {isAffiliateSectionStart && (
                        <Separator className="my-1.5" />
                      )}
                      <Link
                        href={item.href}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    </div>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

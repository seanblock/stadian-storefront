"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides the store chrome (header/footer/cart drawer) under the sales-rep POS
 * surface, which brings its own full-screen shell. Providers stay global —
 * only presentation is gated, so this stays a cheap alternative to a
 * route-group refactor.
 */
export function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/rep" || pathname.startsWith("/rep/")) return null;
  return <>{children}</>;
}

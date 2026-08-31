"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

const GOLD = "#d4a951";

export function AuthNav() {
  const { customer, isAuthenticated, isSalesRep, logout, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="group relative inline-flex items-center gap-2 px-2.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em] opacity-75 transition-opacity duration-300 hover:opacity-100"
      >
        <span
          aria-hidden
          className="size-1 scale-0 rounded-full opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
          style={{ background: GOLD }}
        />
        Sign In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {isSalesRep && (
        <Link
          href="/rep"
          className="group inline-flex items-center gap-2 px-2.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em] opacity-75 transition-opacity duration-300 hover:opacity-100"
        >
          <span
            aria-hidden
            className="size-1 rounded-full transition-transform duration-300 group-hover:scale-150"
            style={{ background: GOLD }}
          />
          Rep Portal
        </Link>
      )}
      <Link
        href="/account"
        className="group inline-flex items-center gap-2 px-2.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em] opacity-75 transition-opacity duration-300 hover:opacity-100"
      >
        <span
          aria-hidden
          className="size-1 rounded-full transition-transform duration-300 group-hover:scale-150"
          style={{ background: GOLD }}
        />
        {customer?.first_name || "Account"}
      </Link>
      {/* Labelled, not a glyph. This was a bare "↗" at 45% opacity, which reads
          as an external-link marker — the one thing it is not — so signing out
          was effectively undiscoverable. Matches the micro-label style of the
          links beside it. */}
      <button
        type="button"
        onClick={() => logout()}
        className="px-2.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em] opacity-55 transition-opacity duration-300 hover:opacity-100"
      >
        Sign out
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

const GOLD = "#d4a951";

export function AuthNav() {
  const { customer, isAuthenticated, logout, loading } = useAuth();

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
      <button
        type="button"
        onClick={() => logout()}
        className="text-[11px] font-medium opacity-45 transition-opacity duration-300 hover:opacity-80"
        aria-label="Sign out"
      >
        ↗
      </button>
    </div>
  );
}

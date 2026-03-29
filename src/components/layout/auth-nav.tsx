"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

export function AuthNav() {
  const { customer, isAuthenticated, logout, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/account"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {customer?.first_name || "Account"}
      </Link>
      <Button variant="ghost" size="sm" onClick={() => logout()}>
        Sign Out
      </Button>
    </div>
  );
}

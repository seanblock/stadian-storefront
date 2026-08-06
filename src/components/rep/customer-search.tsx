"use client";

import { useEffect, useRef, useState } from "react";
import type { RepCustomer } from "@stadian/storefront-sdk";
import { searchRepCustomers } from "@/app/actions/rep";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

/** Debounced customer search with big tappable result rows. */
export function CustomerSearch({
  onSelect,
  autoFocus,
}: {
  onSelect: (customer: RepCustomer) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RepCustomer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      const result = await searchRepCustomers({
        search: query.trim() || undefined,
        limit: 20,
      });
      if (result.ok) {
        setResults(result.data.items);
        setError(null);
      } else {
        setResults([]);
        setError(result.message);
      }
      setLoading(false);
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          inputMode="search"
          placeholder="Search customers by name, email, or company…"
          className="h-14 pl-11 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
          aria-label="Search customers"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
        {loading ? (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : results && results.length > 0 ? (
          results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 active:bg-muted"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-[#0a1a2e]">
                  {c.name || c.email}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {c.email}
                  {c.company_name ? ` · ${c.company_name}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {c.customer_type === "business" && (
                  <Badge variant="secondary">B2B</Badge>
                )}
                {c.account_status !== "active" && (
                  <Badge variant="outline">{c.account_status}</Badge>
                )}
              </span>
            </button>
          ))
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            {query
              ? "No customers match that search."
              : "No customers yet — create one below."}
          </p>
        )}
      </div>
    </div>
  );
}

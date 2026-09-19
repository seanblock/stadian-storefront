"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RepCustomer } from "@stadian/storefront-sdk";
import { useRepSale } from "@/providers/rep-sale-provider";
import { searchRepCustomers } from "@/app/actions/rep";
import { CustomerCreateDialog } from "@/components/rep/customer-create-dialog";
import { CustomerRow, CustomerRowHeader } from "@/components/rep/customer-row";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

type Filter = "all" | "mine" | "unclaimed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mine", label: "My accounts" },
  { key: "unclaimed", label: "Unclaimed" },
];

/**
 * The rep's book of business — a browsing surface, not the POS picker. One
 * customer per row so a name is found by scanning a single column, with the
 * things a rep needs before calling an account alongside it: contact details,
 * whether it is theirs or still unclaimed, and their own sales history.
 */
export default function RepCustomersPage() {
  const router = useRouter();
  const { selectCustomer } = useRepSale();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [customers, setCustomers] = useState<RepCustomer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const result = await searchRepCustomers({
        search: query.trim() || undefined,
        limit: 50,
      });
      if (result.ok) {
        setCustomers(result.data.items);
        setError(null);
      } else {
        setCustomers([]);
        setError(result.message);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const startSaleFor = useCallback(
    async (customer: RepCustomer) => {
      try {
        await selectCustomer(customer, { newSale: true });
        router.push("/rep/new-sale");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start a sale. Please try again.");
      }
    },
    [router, selectCustomer]
  );

  const visible = (customers ?? []).filter((c) =>
    filter === "mine" ? c.is_mine : filter === "unclaimed" ? !c.is_mine : true
  );

  const mineCount = (customers ?? []).filter((c) => c.is_mine).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#0a1a2e]">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {customers === null
              ? "Loading your book…"
              : `${mineCount} of ${customers.length} ${
                  customers.length === 1 ? "account is" : "accounts are"
                } yours — unclaimed accounts become yours when you sell to them.`}
          </p>
        </div>
        <CustomerCreateDialog onCreated={startSaleFor} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            inputMode="search"
            placeholder="Search by name, email, or company…"
            className="h-12 pl-11 text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search customers"
          />
        </div>
        <div className="flex gap-2" role="group" aria-label="Filter customers">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`h-12 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
                filter === key
                  ? "border-[#0a1a2e] bg-[#0a1a2e] text-white"
                  : "border-border bg-white hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {customers === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-border bg-white px-4 py-14 text-center text-sm text-muted-foreground">
          {query
            ? "No customers match that search."
            : filter === "mine"
              ? "No accounts are yours yet — sell to an unclaimed one and it moves into your book."
              : filter === "unclaimed"
                ? "No unclaimed accounts right now."
                : "No customers yet — create one to get started."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="hidden md:block">
            <CustomerRowHeader />
          </div>
          {visible.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              onStartSale={startSaleFor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

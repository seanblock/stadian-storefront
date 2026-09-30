"use client";

import type { RepCustomer } from "@stadian/storefront-sdk";
import { CustomerSearch } from "@/components/rep/customer-search";
import { CustomerCreateDialog } from "@/components/rep/customer-create-dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, Loader2, UserRound } from "lucide-react";

const NAVY = "#0a1a2e";

/**
 * Who the sale is for, shown above the catalog on narrow screens (the rail
 * header carries it on wide ones). Tapping it returns to the customer step;
 * rebinding mid-build reprices the open lines at the new customer's tier.
 */
export function CustomerChip({
  customer,
  onOpen,
}: {
  customer: RepCustomer | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex min-h-11 max-w-full items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors ${
        customer
          ? "border-[#0a1a2e]/25 bg-white hover:bg-muted"
          : "border-dashed border-[#0a1a2e]/40 bg-transparent text-muted-foreground hover:bg-white"
      }`}
    >
      <UserRound className="size-4 shrink-0" aria-hidden />
      <span className="truncate" style={customer ? { color: NAVY } : undefined}>
        {customer ? (customer.name ?? customer.email) : "Choose a customer"}
      </span>
      <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
    </button>
  );
}

/**
 * Step 1 of a sale. The customer is chosen before any product, because the
 * catalog prices at their tier and checkout cannot proceed without them —
 * leaving it as an optional control beside the cart meant reps built an order
 * and then stalled at a disabled Continue button.
 */
export function CustomerStep({
  customer,
  selecting,
  onSelect,
  onKeep,
}: {
  customer: RepCustomer | null;
  /** A pick is binding the cart — block further taps and say so. */
  selecting: boolean;
  onSelect: (customer: RepCustomer) => void;
  /** Continue with the already-attached customer (when changing mid-sale). */
  onKeep: () => void;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#0a1a2e]">Who is this sale for?</h1>
          <p className="text-sm text-muted-foreground">
            Search for an existing customer, or create a new one.
          </p>
        </div>
        <CustomerCreateDialog onCreated={onSelect} />
      </div>

      {customer && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-[#0a1a2e]/25 bg-white p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Currently selling to
            </p>
            <p className="truncate font-medium text-[#0a1a2e]">
              {customer.name || customer.email}
            </p>
          </div>
          <Button className="h-12 gap-2" onClick={onKeep} disabled={selecting}>
            Keep {customer.name?.split(" ")[0] || "customer"}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}

      <div className={`flex min-h-0 flex-1 flex-col ${selecting ? "pointer-events-none opacity-50" : ""}`}>
        <CustomerSearch onSelect={onSelect} autoFocus={!customer} />
      </div>

      {selecting && (
        <div
          role="status"
          className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium"
          style={{ color: NAVY }}
        >
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Loading customer…
        </div>
      )}
    </div>
  );
}

"use client";

import type { RepCustomer } from "@stadian/storefront-sdk";
import { CustomerSearch } from "@/components/rep/customer-search";
import { CustomerCreateDialog } from "@/components/rep/customer-create-dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UserRound, ChevronDown } from "lucide-react";

const NAVY = "#0a1a2e";

/**
 * Attaching the customer is a chip on the sale screen, not a gate in front of
 * it — a rep can start ringing items the moment the catalog loads and bind the
 * account whenever it comes up. Binding mid-build reprices the open lines at
 * the customer's tier, so there is no penalty for doing it late.
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
        {customer ? (customer.name ?? customer.email) : "Walk-in — tap to attach"}
      </span>
      <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
    </button>
  );
}

export function CustomerPickerSheet({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: RepCustomer) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetTitle className="sr-only">Attach a customer</SheetTitle>
        <div className="flex h-full flex-col gap-3 p-4">
          <CustomerSearch onSelect={onSelect} autoFocus />
          <div className="flex justify-center">
            <CustomerCreateDialog onCreated={onSelect} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

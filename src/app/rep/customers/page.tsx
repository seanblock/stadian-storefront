"use client";

import { useRouter } from "next/navigation";
import type { RepCustomer } from "@stadian/storefront-sdk";
import { useRepSale } from "@/providers/rep-sale-provider";
import { CustomerSearch } from "@/components/rep/customer-search";
import { CustomerCreateDialog } from "@/components/rep/customer-create-dialog";

export default function RepCustomersPage() {
  const router = useRouter();
  const { startSale, selectCustomer } = useRepSale();

  async function startSaleFor(customer: RepCustomer) {
    startSale();
    try {
      await selectCustomer(customer);
    } catch {
      // Binding failed (e.g. unusable account) — still land on new-sale where
      // the error surfaces on selection.
    }
    router.push("/rep/new-sale");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-[#0a1a2e]">Customers</h1>
        <CustomerCreateDialog onCreated={startSaleFor} />
      </div>
      <p className="text-sm text-muted-foreground">
        Tap a customer to start a sale for them.
      </p>
      <CustomerSearch onSelect={startSaleFor} />
    </div>
  );
}

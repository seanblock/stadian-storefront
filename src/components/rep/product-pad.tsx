"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { StorefrontCart, StorefrontProduct } from "@stadian/storefront-sdk";
import { QtyStepper } from "@/components/rep/qty-stepper";
import { fmtCurrency } from "@/components/rep/format";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

/**
 * Touch product grid: category chips, big cards, a permanent stepper on each
 * card wired straight to the sale cart (quantity shown = quantity in cart).
 */
export function ProductPad({
  products,
  cart,
  cartBusy,
  onAdd,
  onSetQuantity,
}: {
  products: StorefrontProduct[];
  cart: StorefrontCart | null;
  cartBusy: boolean;
  onAdd: (productId: string) => void;
  onSetQuantity: (itemId: string, quantity: number) => void;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      for (const c of p.categories ?? []) map.set(c.slug, c.name);
    }
    return [...map.entries()];
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category && !(p.categories ?? []).some((c) => c.slug === category)) {
        return false;
      }
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, category, query]);

  const cartLines = useMemo(() => {
    const map = new Map<string, { itemId: string; quantity: number }>();
    for (const item of cart?.items ?? []) {
      map.set(item.product_id, { itemId: item.id, quantity: item.quantity });
    }
    return map;
  }, [cart]);

  const chip = (active: boolean) =>
    `h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
      active
        ? "border-[#0a1a2e] bg-[#0a1a2e] text-white"
        : "border-border bg-white text-foreground hover:bg-muted"
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products…"
          className="h-12 pl-11 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button type="button" className={chip(category === null)} onClick={() => setCategory(null)}>
            All
          </button>
          {categories.map(([id, name]) => (
            <button
              key={id}
              type="button"
              className={chip(category === id)}
              onClick={() => setCategory(category === id ? null : id)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {visible.map((p) => {
          const line = cartLines.get(p.id);
          return (
            <div
              key={p.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-white"
            >
              <button
                type="button"
                onClick={() => (line ? onSetQuantity(line.itemId, line.quantity + 1) : onAdd(p.id))}
                disabled={cartBusy}
                className="flex flex-1 flex-col text-left transition-colors hover:bg-muted/40 active:bg-muted disabled:opacity-60"
              >
                <div className="relative aspect-[4/3] w-full bg-[#f4f4f2]">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-serif text-2xl text-muted-foreground/50">
                      {p.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-[#0a1a2e]">
                    {p.name}
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {p.price != null ? fmtCurrency(p.price) : "Priced at cart"}
                  </span>
                </div>
              </button>
              <div className="border-t border-border p-2">
                {line ? (
                  <QtyStepper
                    quantity={line.quantity}
                    disabled={cartBusy}
                    onChange={(next) => onSetQuantity(line.itemId, next)}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={cartBusy}
                    onClick={() => onAdd(p.id)}
                    className="h-12 w-full rounded-md border border-[#0a1a2e]/20 text-sm font-medium text-[#0a1a2e] transition-colors hover:bg-[#0a1a2e] hover:text-white disabled:opacity-40"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No products match.
          </p>
        )}
      </div>
    </div>
  );
}

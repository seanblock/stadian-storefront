"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { StorefrontCart, StorefrontProduct } from "@stadian/storefront-sdk";
import { QtyStepper } from "@/components/rep/qty-stepper";
import { ProductCoaButton } from "@/components/rep/product-coa-button";
import { fmtCurrency } from "@/components/rep/format";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cartQuantityLimits } from "@/lib/cart-quantity";

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
    const map = new Map<string, StorefrontCart["items"][number]>();
    for (const item of cart?.items ?? []) {
      map.set(item.product_id, item);
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
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="relative shrink-0">
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
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
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

      {/*
        Two shapes, one markup. A phone gets a dense row — 56px thumbnail, name,
        price, action — so six to eight products land on screen instead of two
        and a half. From sm up it reflows into the image-led card grid, which is
        what a tablet has the room to earn.
      */}
      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-1 gap-2 overflow-y-auto pb-1 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
        {visible.map((p) => {
          const line = cartLines.get(p.id);
          const limits = cartQuantityLimits(line ?? { ...p, quantity: 0 });
          const cannotAdd = limits.atMax || (limits.max !== null && limits.max < limits.min);
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-white p-2 sm:flex-col sm:items-stretch sm:gap-0 sm:p-0"
            >
              <button
                type="button"
                onClick={() => (line ? onSetQuantity(line.id, line.quantity + 1) : onAdd(p.id))}
                disabled={cartBusy || cannotAdd}
                className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:bg-muted/40 active:bg-muted disabled:opacity-60 sm:flex-col sm:items-stretch sm:gap-0"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-[#f4f4f2] sm:aspect-[4/3] sm:size-auto sm:w-full sm:rounded-none">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 56px, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-serif text-xl text-muted-foreground/50 sm:text-2xl">
                      {p.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-0.5 sm:p-3">
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-[#0a1a2e]">
                    {p.name}
                  </span>
                  {(() => {
                    // Once it's in the cart, price the card the way the cart
                    // does: effective per-unit after discounts, with the tier
                    // that earned it (qty breaks are why reps bump quantity).
                    const effective =
                      line && line.net_line_total != null && line.quantity > 0
                        ? line.net_line_total / line.quantity
                        : null;
                    const listed = line?.line_subtotal != null && line.quantity > 0
                      ? line.line_subtotal / line.quantity
                      : p.price;
                    const tier = line?.discounts?.find((d) => d.kind === "volume");
                    if (effective == null || listed == null || effective >= listed - 0.005) {
                      return (
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {p.price != null ? fmtCurrency(p.price) : "Priced at cart"}
                        </span>
                      );
                    }
                    return (
                      <>
                        <span className="flex flex-wrap items-baseline gap-x-1.5 text-sm tabular-nums">
                          <span className="font-medium text-emerald-700">{fmtCurrency(effective)} ea</span>
                          <s className="text-muted-foreground">{fmtCurrency(listed)}</s>
                        </span>
                        {tier && <span className="text-xs text-emerald-700">{tier.label}</span>}
                      </>
                    );
                  })()}
                </div>
              </button>
              <div className="shrink-0 sm:border-t sm:border-border sm:p-2">
                {line ? (
                  <QtyStepper
                    quantity={line.quantity}
                    disabled={cartBusy}
                    min={limits.min}
                    max={limits.max}
                    onChange={(next) => onSetQuantity(line.id, next)}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={cartBusy || cannotAdd}
                    onClick={() => onAdd(p.id)}
                    className="h-12 min-w-20 rounded-md border border-[#0a1a2e]/20 px-4 text-sm font-medium text-[#0a1a2e] transition-colors hover:bg-[#0a1a2e] hover:text-white disabled:opacity-40 sm:w-full sm:min-w-0 sm:px-0"
                  >
                    {cannotAdd ? "Unavailable" : limits.min > 1 ? `Add ${limits.min}` : "Add"}
                  </button>
                )}
                {limits.max !== null && <p className="mt-1 text-center text-xs text-muted-foreground">Limit {limits.max}</p>}
                {p.has_coa ? <ProductCoaButton slug={p.slug} name={p.name} /> : <p className="mt-2 text-center text-xs text-muted-foreground">No COA uploaded. Ask your store administrator.</p>}
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

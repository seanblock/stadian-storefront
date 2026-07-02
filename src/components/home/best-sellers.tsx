import Link from "next/link";
import Image from "next/image";
import type { StorefrontProduct } from "@stadian/storefront-sdk";
import { formatCurrency } from "@/lib/utils";

interface BestSellersProps {
  products: StorefrontProduct[];
}

export function BestSellers({ products }: BestSellersProps) {
  if (products.length === 0) return null;

  const items = products.slice(0, 8);

  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              The catalog
            </p>
            <h2 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
              Best <span className="italic">sellers</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-foreground"
          >
            <span className="relative">
              Shop all compounds
              <span className="absolute inset-x-0 -bottom-1 block h-px origin-left scale-x-100 bg-current transition-transform duration-500 group-hover:scale-x-[0.4]" />
            </span>
            <svg
              className="size-4 transition-transform duration-500 group-hover:translate-x-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </header>

        <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {items.map((product) => (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                className="group block overflow-hidden rounded-lg border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-serif text-3xl italic text-muted-foreground/40">
                        {product.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {product.badges?.[0] && (
                    <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground backdrop-blur">
                      {product.badges[0].label}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                    {product.name}
                  </h3>
                  {product.form_type && (
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {product.form_type}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">
                      {product.price != null ? (
                        <>
                          {formatCurrency(product.price)}
                          {product.compare_at_price != null &&
                            product.compare_at_price > product.price && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
                                {formatCurrency(product.compare_at_price)}
                              </span>
                            )}
                        </>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                          View options
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors group-hover:text-foreground">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

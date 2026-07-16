import Link from "next/link";
import Image from "next/image";
import type { StorefrontProduct } from "@stadian/storefront-sdk";
import { formatCurrency } from "@/lib/utils";

interface BestSellersProps {
  products: StorefrontProduct[];
}

// Fixed brand palette — this section is an off-white "gallery" panel so the
// dark product renders pop like framed art. CREAM is retained only for cream
// ink on the navy product cards below.
const NAVY = "#0a1a2e";
const NAVY_DIM = "#0a1a2e99";
const CREAM = "#f3ead5";
// Section ground — a barely-there off-white so this panel still separates from
// the pure-white sections above and below it.
const PANEL = "#f7f6f3";
const GOLD_DEEP = "#9a7a3a";

export function BestSellers({ products }: BestSellersProps) {
  if (products.length === 0) return null;

  const items = products.slice(0, 8);

  return (
    <section style={{ background: PANEL, color: NAVY }}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.22em]"
              style={{ color: GOLD_DEEP }}
            >
              The catalog
            </p>
            <h2 className="mt-2 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Best <span className="italic">sellers</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em]"
            style={{ color: NAVY }}
          >
            <span className="relative">
              Shop all products
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
                className="group block"
              >
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-lg shadow-[0_18px_40px_-18px_rgba(10,26,46,0.45)] transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_28px_56px_-20px_rgba(10,26,46,0.55)]"
                  style={{ background: NAVY }}
                >
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
                      <span className="font-serif text-3xl italic" style={{ color: `${CREAM}66` }}>
                        {product.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {product.badges?.[0] && (
                    <span
                      className="absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] backdrop-blur"
                      style={{ background: `${CREAM}e6`, color: NAVY }}
                    >
                      {product.badges[0].label}
                    </span>
                  )}
                </div>
                <div className="mt-4 px-0.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="line-clamp-1 font-serif text-lg leading-snug">
                      {product.name}
                    </h3>
                    <span className="shrink-0 text-sm font-bold">
                      {product.price != null ? formatCurrency(product.price) : ""}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3">
                    {product.form_type ? (
                      <p
                        className="text-[10px] uppercase tracking-[0.16em]"
                        style={{ color: NAVY_DIM }}
                      >
                        {product.form_type}
                      </p>
                    ) : (
                      <span />
                    )}
                    {product.compare_at_price != null &&
                      product.price != null &&
                      product.compare_at_price > product.price && (
                        <span
                          className="text-xs line-through"
                          style={{ color: NAVY_DIM }}
                        >
                          {formatCurrency(product.compare_at_price)}
                        </span>
                      )}
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

import Link from "next/link";
import Image from "next/image";
import type { StorefrontProduct } from "@stadian/storefront-sdk";

interface FeaturedEditProps {
  products: StorefrontProduct[];
}

export function FeaturedEdit({ products }: FeaturedEditProps) {
  if (products.length === 0) return null;

  const [lead, ...rest] = products;
  const supporting = rest.slice(0, 4);

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        {/* Editorial intro */}
        <header className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12 lg:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              The Edit
            </p>
          </div>
          <div className="col-span-12 mt-4 lg:col-span-9 lg:mt-0">
            <h2 className="font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              A short list of <span className="italic">favorites</span>—
              <br className="hidden sm:block" />
              chosen with care, refreshed often.
            </h2>
          </div>
        </header>

        {/* Asymmetric grid */}
        <div className="mt-14 grid grid-cols-12 gap-6 lg:gap-8">
          {/* Lead product — large, left */}
          <Link
            href={`/products/${lead.slug}`}
            className="group col-span-12 lg:col-span-7"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-muted">
              {lead.image_url ? (
                <Image
                  src={lead.image_url}
                  alt={lead.name}
                  fill
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              ) : (
                <PlaceholderArt />
              )}
              <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-background/85 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground backdrop-blur">
                Featured
              </span>
            </div>
            <div className="mt-5 flex items-end justify-between gap-6">
              <div>
                <h3 className="font-serif text-2xl leading-tight text-foreground sm:text-3xl">
                  {lead.name}
                </h3>
                {lead.form_type && (
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {lead.form_type}
                  </p>
                )}
              </div>
              <span className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground sm:inline">
                View →
              </span>
            </div>
          </Link>

          {/* Supporting products — 2x2 on the right */}
          <div className="col-span-12 grid grid-cols-2 gap-6 lg:col-span-5 lg:gap-8">
            {supporting.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group block"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-muted">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.05]"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <PlaceholderArt />
                  )}
                </div>
                <p className="mt-3 line-clamp-2 font-serif text-base leading-snug text-foreground sm:text-lg">
                  {product.name}
                </p>
                {product.form_type && (
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {product.form_type}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Footer link */}
        <div className="mt-14 flex items-center justify-between border-t border-border pt-6">
          <p className="hidden font-serif text-base italic text-muted-foreground sm:block">
            {products.length} pieces currently in rotation.
          </p>
          <Link
            href="/products"
            className="group ml-auto inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-foreground"
          >
            <span className="relative">
              See everything
              <span className="absolute inset-x-0 -bottom-1 block h-px origin-left scale-x-100 bg-current transition-transform duration-500 group-hover:scale-x-[0.4]" />
            </span>
            <svg className="size-4 transition-transform duration-500 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function PlaceholderArt() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
      <span className="font-serif text-4xl italic text-muted-foreground/40">—</span>
    </div>
  );
}

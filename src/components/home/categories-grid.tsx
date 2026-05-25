import Link from "next/link";
import type { StorefrontCategory } from "@stadian/storefront-sdk";

interface CategoriesGridProps {
  categories: StorefrontCategory[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  if (categories.length === 0) return null;

  // Cap to keep the section composed
  const items = categories.slice(0, 6);

  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Index
            </p>
            <h2 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
              Shop by <span className="italic">category</span>
            </h2>
          </div>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
            {String(items.length).padStart(2, "0")} departments
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((cat, idx) => (
            <li key={cat.slug}>
              <Link
                href={`/products?category=${cat.slug}`}
                className="group relative block overflow-hidden rounded-sm border border-border bg-background p-6 transition-colors duration-500 hover:border-foreground/30"
                style={{
                  // Each card uses the category's own color as an accent
                  ["--cat-color" as string]: cat.color,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full transition-transform duration-500 group-hover:scale-[1.6]"
                    style={{ background: "var(--cat-color)" }}
                  />
                </div>
                <h3 className="mt-12 font-serif text-2xl leading-tight text-foreground transition-transform duration-500 group-hover:-translate-y-1 sm:text-3xl">
                  {cat.name}
                </h3>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors group-hover:text-foreground">
                    Browse
                  </span>
                  <svg
                    className="size-4 text-muted-foreground transition-all duration-500 group-hover:translate-x-1 group-hover:text-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {/* Bottom accent bar that fills on hover */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100"
                  style={{ background: "var(--cat-color)" }}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

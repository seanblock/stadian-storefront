import Link from "next/link";
import type { StorefrontBranding } from "@stadian/storefront-sdk";

interface ClosingStatementProps {
  branding: StorefrontBranding;
}

export function ClosingStatement({ branding }: ClosingStatementProps) {
  const storeName = branding.store_name || "We";

  return (
    <section className="relative overflow-hidden bg-foreground text-background">
      {/* Decorative oversized initial */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-16 font-serif text-[28rem] italic leading-none text-background/[0.04] select-none sm:-right-16 sm:-top-24 sm:text-[40rem]"
      >
        {storeName.charAt(0).toUpperCase()}
      </span>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-background/50">
          A note from us
        </p>
        <blockquote className="mt-6 max-w-3xl font-serif text-4xl leading-[1.15] tracking-tight text-background sm:text-5xl lg:text-6xl">
          <span className="italic text-background/70">“</span>
          At Elemental Peptides, our mission is to build the world&apos;s most
          trusted luxury peptide brand by setting the highest standard for
          transparency, uncompromising quality, and unwavering integrity in
          everything we do.
          <span className="italic text-background/70">”</span>
        </blockquote>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-x-12 gap-y-8 border-t border-background/10 pt-8">
          <div className="max-w-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/50">
              — The {storeName} team
            </p>
            <p className="mt-4 text-sm leading-relaxed text-background/75">
              New arrivals are added thoughtfully, not constantly. If you have a
              question—about a piece, a fit, a use case—we&apos;d genuinely like
              to hear from you.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/products"
              className="group inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-background"
            >
              <span className="relative">
                Begin shopping
                <span className="absolute inset-x-0 -bottom-1 block h-px origin-left scale-x-100 bg-current transition-transform duration-500 group-hover:scale-x-[0.4]" />
              </span>
              <svg className="size-4 transition-transform duration-500 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium uppercase tracking-[0.18em] text-background/60 transition-colors hover:text-background"
            >
              Read our story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

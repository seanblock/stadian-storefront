import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How We Test",
  description:
    "Every batch is analyzed by an independent third-party laboratory before release. Certificates of analysis are published on each product page and furnished on request.",
  alternates: { canonical: "/lab-results" },
};

export default function LabResultsPage() {
  return (
    <div className="bg-background">
      {/* Header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Transparency
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            How we <span className="italic">test</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Every batch we sell is analyzed by an independent third-party
            laboratory before release. The certificate of analysis for each
            compound is published on its product page — so you never have to
            take a purity claim on faith.
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
            <div>
              <h2 className="font-serif text-xl text-foreground">
                What a COA tells you
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                A certificate of analysis is an independent lab&apos;s report on
                a specific batch: confirmation of the compound&apos;s identity
                and a measured purity value. It is tied to the batch number
                printed on the vial you receive.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-xl text-foreground">
                How batches are tested
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Samples from each production batch are sent to a third-party
                analytical laboratory for identity and purity analysis. Our
                acceptance standard is ≥99% purity — batches that don&apos;t
                meet it aren&apos;t sold.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-xl text-foreground">
                Where to find certificates
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Each product page links the certificate for its current batch.
                Every vial is labeled with its batch number — if you need the
                certificate for a specific batch you purchased, contact us and
                we&apos;ll furnish it directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/products"
              className="group inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-foreground"
            >
              <span className="relative">
                Browse the catalog
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
            <Link
              href="/faq"
              className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

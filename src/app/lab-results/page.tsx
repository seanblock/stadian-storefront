import type { Metadata } from "next";
import Link from "next/link";
import type { StorefrontProduct } from "@stadian/storefront-sdk";
import { getStadianClient } from "@/lib/stadian";
import { COA_RECORDS, type CoaRecord } from "@/lib/lab-results";

export const metadata: Metadata = {
  title: "Lab Results",
  description:
    "Third-party certificates of analysis (COAs) for every batch we sell. Identity and purity verified by an independent laboratory.",
  alternates: { canonical: "/lab-results" },
};

export default async function LabResultsPage() {
  let products: StorefrontProduct[] = [];
  try {
    const client = getStadianClient();
    const result = await client.catalog.list({ page: 1, limit: 100 });
    products = result.items;
  } catch {
    // Page still renders methodology; table section hides when empty.
  }

  const rows = products.map((product) => ({
    product,
    records: COA_RECORDS[product.slug] ?? [],
  }));
  const publishedCount = rows.filter((r) => r.records.length > 0).length;

  return (
    <div className="bg-background">
      {/* Header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Transparency
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Lab results &{" "}
            <span className="italic">certificates of analysis</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Every batch we sell is analyzed by an independent third-party
            laboratory before release. The certificate of analysis for each
            batch is published here — so you never have to take a purity claim
            on faith.
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
                Matching your vial
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Every vial is labeled with its batch number. Find that batch
                below to see the certificate for exactly what&apos;s in your
                hands. If a batch you purchased isn&apos;t listed, contact us
                and we&apos;ll send the certificate directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results table */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {publishedCount === 0 && (
            <div className="mb-10 rounded-sm border border-border bg-muted/30 px-6 py-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  Current status:
                </span>{" "}
                our first production batches are with the lab now. Certificates
                will be published on this page as soon as they&apos;re returned
                — before products ship.
              </p>
            </div>
          )}

          {rows.length > 0 && (
            <ul className="divide-y divide-border border-y border-border">
              {rows.map(({ product, records }) => (
                <li
                  key={product.id}
                  className="grid grid-cols-12 items-baseline gap-x-6 gap-y-2 py-5"
                >
                  <div className="col-span-12 sm:col-span-4">
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-serif text-lg leading-tight text-foreground underline-offset-4 hover:underline"
                    >
                      {product.name}
                    </Link>
                  </div>
                  <div className="col-span-12 sm:col-span-8">
                    {records.length > 0 ? (
                      <ul className="space-y-2">
                        {records.map((record: CoaRecord) => (
                          <li
                            key={record.batch}
                            className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm"
                          >
                            <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
                              Batch {record.batch}
                            </span>
                            <span className="font-medium text-foreground">
                              {record.purity} purity
                            </span>
                            <span className="text-muted-foreground">
                              {record.testedBy} · {record.testedOn}
                            </span>
                            <a
                              href={record.coaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-foreground underline underline-offset-4"
                            >
                              View COA (PDF)
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm italic text-muted-foreground">
                        COA pending publication — batch at lab
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10">
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
          </div>
        </div>
      </section>
    </div>
  );
}

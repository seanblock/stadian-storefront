import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Synthesized & sealed",
    body: "Compounds are synthesized to a ≥99% purity specification, then sealed in-house under controlled conditions with batch-numbered labeling for full traceability.",
  },
  {
    number: "02",
    title: "Independently tested",
    body: "Every batch is sent to an independent third-party laboratory for identity and purity analysis before it's released for sale. The resulting certificate of analysis is published on each product's page.",
  },
  {
    number: "03",
    title: "Cold-chain shipped",
    body: "Orders ship in temperature-controlled packaging with tracking. Complimentary shipping on orders over $100, and free returns within 30 days.",
  },
] as const;

export function OurStandard() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <header className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12 lg:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Our standard
            </p>
          </div>
          <div className="col-span-12 mt-4 lg:col-span-9 lg:mt-0">
            <h2 className="max-w-3xl font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              From synthesis to your bench,{" "}
              <span className="italic">verified at every step</span>.
            </h2>
          </div>
        </header>

        <ol className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step) => (
            <li key={step.number} className="border-t border-border pt-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Step {step.number}
              </span>
              <h3 className="mt-3 font-serif text-2xl leading-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border pt-6">
          <Link
            href="/lab-results"
            className="group inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-foreground"
          >
            <span className="relative">
              How we test
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
  );
}

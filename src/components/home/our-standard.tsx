import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Sourced with intent",
    body: "We stock a focused catalog of clean-label supplements rather than chasing every trend — each one selected and handled with care.",
  },
  {
    number: "02",
    title: "Sealed & batch-numbered",
    body: "Every batch is sealed and numbered under controlled conditions, so every unit is traceable to its production run.",
  },
  {
    number: "03",
    title: "Cold-chain shipped",
    body: "Orders ship in temperature-controlled packaging where it counts, with tracking on every shipment.",
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
              From our door to yours,{" "}
              <span className="italic">handled with care</span>.
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
            href="/products"
            className="group inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-foreground"
          >
            <span className="relative">
              View the catalog
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

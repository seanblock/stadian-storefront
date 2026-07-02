const ROWS = [
  {
    label: "Third-party COA linked on every product page",
    us: true,
    them: "Rarely published",
  },
  {
    label: "Batch number printed on every vial",
    us: true,
    them: "Sometimes",
  },
  {
    label: "≥99% purity acceptance standard",
    us: true,
    them: "Unverified claims",
  },
  {
    label: "Cold-chain, temperature-controlled shipping",
    us: true,
    them: "Standard post",
  },
  {
    label: "Free returns within 30 days",
    us: true,
    them: "All sales final",
  },
  {
    label: "Certificates furnished on request for any batch",
    us: true,
    them: "No response",
  },
] as const;

export function Comparison({ storeName }: { storeName: string }) {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <header className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            The difference
          </p>
          <h2 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
            Held to a <span className="italic">higher standard</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Most research-peptide vendors ask you to trust a number on a label.
            We think you should be able to check it.
          </p>
        </header>

        <div className="mt-10 overflow-hidden rounded-lg border border-border">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-border bg-muted/40 px-5 py-3.5 sm:grid-cols-[1fr_9rem_9rem] sm:px-7">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              What to look for
            </span>
            <span className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-foreground">
              {storeName}
            </span>
            <span className="text-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Typical vendor
            </span>
          </div>

          <ul className="divide-y divide-border">
            {ROWS.map((row) => (
              <li
                key={row.label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-5 py-4 sm:grid-cols-[1fr_9rem_9rem] sm:px-7"
              >
                <span className="text-sm font-medium text-foreground">
                  {row.label}
                </span>
                <span className="flex justify-center">
                  <span className="flex size-6 items-center justify-center rounded-full bg-foreground">
                    <svg
                      className="size-3.5 text-background"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                </span>
                <span className="text-center text-xs italic text-muted-foreground">
                  {row.them}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

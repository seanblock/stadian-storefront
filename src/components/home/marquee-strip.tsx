interface MarqueeStripProps {
  items?: string[];
}

const DEFAULTS = [
  "Complimentary shipping over $100",
  "Free returns within 30 days",
  "Independently sourced",
  "Built to last",
  "Customer care, made human",
];

export function MarqueeStrip({ items = DEFAULTS }: MarqueeStripProps) {
  const repeated = [...items, ...items];
  return (
    <section
      aria-label="Store highlights"
      className="border-b border-border bg-foreground text-background"
    >
      <div className="relative overflow-hidden py-3">
        <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap">
          {repeated.map((item, idx) => (
            <span
              key={idx}
              className="flex items-center gap-12 font-serif text-xl italic text-background/90"
            >
              {item}
              <span aria-hidden className="inline-block size-1 rounded-full bg-background/40" />
            </span>
          ))}
        </div>
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-foreground to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-foreground to-transparent" />
      </div>
    </section>
  );
}

import { FlaskConical, ShieldCheck, Snowflake, RotateCcw } from "lucide-react";

const ITEMS = [
  {
    icon: FlaskConical,
    title: "Independently tested",
    body: "Third-party lab analysis on every batch — COA on the product page.",
  },
  {
    icon: ShieldCheck,
    title: "≥99% purity standard",
    body: "Batches that don't meet our acceptance standard aren't sold.",
  },
  {
    icon: Snowflake,
    title: "Cold-chain shipped",
    body: "Temperature-controlled packaging, tracked from our door to yours.",
  },
  {
    icon: RotateCcw,
    title: "30-day returns",
    body: "Free returns within 30 days. Free shipping on orders over $100.",
  },
] as const;

export function TrustBar() {
  return (
    <section aria-label="Why buy from us" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {ITEMS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-4 px-1 py-6 lg:px-7">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-[18px] text-foreground" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

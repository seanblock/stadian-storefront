import type { StorefrontTrustSignal } from "@stadian/storefront-sdk";
import { LucideIcon } from "@/components/lucide-icon";

// Wholesale-safe defaults, shown only when the tenant has not configured its
// own trust signals in the Stadian admin (branding.trust_signals).
const FALLBACK_SIGNALS: StorefrontTrustSignal[] = [
  {
    title: "Third-party tested",
    description:
      "Every batch is tested by independent labs for purity and label accuracy.",
    icon_name: "shield-check",
    link_url: null,
    link_text: null,
  },
  {
    title: "Batch-numbered",
    description:
      "Every unit is labeled with its batch, traceable to its production run.",
    icon_name: "tag",
    link_url: null,
    link_text: null,
  },
  {
    title: "Cold-chain shipped",
    description:
      "Temperature-sensitive products ship in cold packaging with tracking.",
    icon_name: "snowflake",
    link_url: null,
    link_text: null,
  },
  {
    title: "Sealed in-house",
    description:
      "Products are sealed under controlled conditions before they leave our door.",
    icon_name: "lock",
    link_url: null,
    link_text: null,
  },
];

export function TrustBar({ signals }: { signals?: StorefrontTrustSignal[] }) {
  const items = signals && signals.length > 0 ? signals : FALLBACK_SIGNALS;

  return (
    <section aria-label="Our standards" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {items.map((signal) => (
            <li key={signal.title} className="flex items-start gap-4 px-1 py-6 lg:px-7">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <LucideIcon
                  name={signal.icon_name ?? "check"}
                  size={18}
                  className="text-foreground"
                />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {signal.title}
                </p>
                {signal.description && (
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {signal.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

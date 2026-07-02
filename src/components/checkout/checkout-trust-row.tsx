import type { StorefrontTrustSignal } from "@stadian/storefront-sdk";
import { LucideIcon } from "@/components/lucide-icon";

/**
 * Compact, tenant-configured trust row shown at the top of checkout. Content
 * comes from the store's admin-managed trust signals (title + optional icon) —
 * nothing hardcoded, so each brand controls its own differentiators.
 */
export function CheckoutTrustRow({
  signals,
}: {
  signals: StorefrontTrustSignal[];
}) {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
      {signals.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-sm text-foreground"
          title={s.description ?? undefined}
        >
          {s.icon_name && (
            <span className="shrink-0 text-muted-foreground">
              <LucideIcon name={s.icon_name} size={16} />
            </span>
          )}
          <span className="font-medium">{s.title}</span>
        </div>
      ))}
    </div>
  );
}

import type { StorefrontVolumeTier } from "@stadian/storefront-sdk";
import { formatCurrency } from "@/lib/utils";

interface VolumePricingProps {
  tiers: StorefrontVolumeTier[];
  basePrice: number;
  currency?: string;
}

export function VolumePricing({
  tiers,
  basePrice,
  currency = "USD",
}: VolumePricingProps) {
  const discountTiers = tiers.filter(
    (t) => t.discount_type && t.discount_value
  );

  if (discountTiers.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {discountTiers.map((tier, i) => {
        const discountedPrice =
          tier.discount_type === "percent"
            ? basePrice * (1 - (tier.discount_value ?? 0) / 100)
            : basePrice - (tier.discount_value ?? 0);

        return (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium"
          >
            <span className="text-muted-foreground">
              {tier.min_quantity}+
            </span>
            <span className="font-semibold">
              {formatCurrency(discountedPrice, currency)}/ea
            </span>
          </span>
        );
      })}
    </div>
  );
}

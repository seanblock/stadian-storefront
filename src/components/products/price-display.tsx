import { formatCurrency } from "@/lib/utils";
import type { StorefrontPrice } from "@stadian/storefront-sdk";

interface PriceDisplayProps {
  prices: StorefrontPrice[];
}

export function PriceDisplay({ prices }: PriceDisplayProps) {
  if (prices.length === 0)
    return <span className="text-muted-foreground">No price</span>;
  const retailPrice = prices.find((p) => p.tier_name === "Retail") ?? prices[0];
  return (
    <span className="text-lg font-bold">
      {formatCurrency(retailPrice.price, retailPrice.currency)}
    </span>
  );
}

import { formatCurrency } from "@/lib/utils";

interface PriceDisplayProps {
  price: number | null;
  compareAtPrice?: number | null;
  currency?: string;
}

export function PriceDisplay({ price, compareAtPrice, currency = "USD" }: PriceDisplayProps) {
  if (price == null)
    return <span className="text-muted-foreground">No price</span>;
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold">
        {formatCurrency(price, currency)}
      </span>
      {compareAtPrice != null && compareAtPrice > price && (
        <span className="text-sm text-muted-foreground line-through">
          {formatCurrency(compareAtPrice, currency)}
        </span>
      )}
    </div>
  );
}

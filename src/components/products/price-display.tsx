import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PriceDisplayProps {
  price: number | null;
  compareAtPrice?: number | null;
  currency?: string;
  /** Show a "Save X%" badge when on sale. Defaults to true. */
  showSavings?: boolean;
  className?: string;
}

export function PriceDisplay({
  price,
  compareAtPrice,
  currency = "USD",
  showSavings = true,
  className,
}: PriceDisplayProps) {
  if (price == null)
    return <span className="text-muted-foreground">No price</span>;

  const onSale = compareAtPrice != null && compareAtPrice > price;
  const savingsPct = onSale
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <span className="text-lg font-bold">{formatCurrency(price, currency)}</span>
      {onSale && (
        <span className="text-sm text-muted-foreground line-through">
          {formatCurrency(compareAtPrice, currency)}
        </span>
      )}
      {onSale && showSavings && savingsPct > 0 && (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
        >
          Save {savingsPct}%
        </Badge>
      )}
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import type { StorefrontProductGroup } from "@stadian/storefront-sdk";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ProductGroupCardProps {
  group: StorefrontProductGroup;
}

export function ProductGroupCard({ group }: ProductGroupCardProps) {
  const prices = group.products
    .map((p) => p.default_price)
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b);

  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];

  // Fall back to the first member product's image when the group has none.
  const imageUrl =
    group.image_url ?? group.products?.find((p) => p.image_url)?.image_url ?? null;

  return (
    <Link href={`/products/${group.slug}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        {/* Group image */}
        {/* -mt-4 cancels the Card's py-4 top padding (its built-in
            has-[>img:first-child]:pt-0 doesn't fire because the Next.js
            <Image fill> must be wrapped in a positioned div, not a bare <img>). */}
        <div className="relative -mt-4 aspect-square w-full overflow-hidden rounded-t-xl bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={group.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-12 opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span className="text-xs font-medium opacity-50">
                {group.product_count} options
              </span>
            </div>
          )}
        </div>

        <CardHeader>
          <CardTitle className="line-clamp-2">{group.name}</CardTitle>
          {group.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {group.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {group.product_count} option{group.product_count !== 1 ? "s" : ""}
          </Badge>
          {minPrice !== undefined && (
            <span className="text-sm font-semibold">
              {minPrice === maxPrice
                ? formatCurrency(minPrice)
                : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`}
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

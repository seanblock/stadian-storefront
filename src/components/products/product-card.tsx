import Link from "next/link";
import Image from "next/image";
import type { StorefrontProduct } from "@stadian/storefront-sdk";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/products/price-display";

interface ProductCardProps {
  product: StorefrontProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        {/* Product image */}
        {/* -mt-4 cancels the Card's py-4 top padding (its built-in
            has-[>img:first-child]:pt-0 doesn't fire because the Next.js
            <Image fill> must be wrapped in a positioned div, not a bare <img>). */}
        <div className="relative -mt-4 aspect-square w-full overflow-hidden rounded-t-xl bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <CardHeader>
          <CardTitle className="line-clamp-2">{product.name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <PriceDisplay
            price={product.price}
            compareAtPrice={product.compare_at_price}
          />
          <div className="flex flex-wrap items-center gap-2">
            {product.form_type && (
              <Badge variant="secondary">{product.form_type}</Badge>
            )}
            {product.categories?.map((cat) => (
              <Badge
                key={cat.slug}
                variant="outline"
                style={{ borderColor: cat.color, color: cat.color }}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

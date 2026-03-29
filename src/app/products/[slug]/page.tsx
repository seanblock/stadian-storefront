import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getStadianClient } from "@/lib/stadian";
import { PriceDisplay } from "@/components/products/price-display";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddToCartButton } from "./add-to-cart-button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getStadianClient().catalog.get(slug);
    return {
      title: product.name,
      description: product.description ?? undefined,
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getStadianClient().catalog.get(slug);
  } catch {
    notFound();
  }

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Product image */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            {product.category_name && (
              <span className="text-sm text-muted-foreground">
                {product.category_name}
              </span>
            )}
            <h1 className="font-heading text-3xl font-semibold leading-tight">
              {product.name}
            </h1>
            {product.form_type && (
              <Badge variant="secondary" className="w-fit">
                {product.form_type}
              </Badge>
            )}
          </div>

          <PriceDisplay prices={product.prices} />

          {product.requires_intake ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Prescription Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This product requires a medical intake form to be completed
                  before it can be ordered. Please complete the intake process
                  to continue.
                </p>
              </CardContent>
            </Card>
          ) : (
            <AddToCartButton productId={product.id} />
          )}

          {product.description && (
            <div className="prose prose-sm text-muted-foreground">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                Description
              </h2>
              <p>{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

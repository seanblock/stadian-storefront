import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getStadianClient } from "@/lib/stadian";
import { fetchWithOptionalAuth } from "@/lib/authed-fetch";
import { arePricesHidden } from "@/lib/pricing-access";
import { SignInForPricing } from "@/components/products/sign-in-for-pricing";
import { getSiteUrl } from "@/lib/site-url";
import { AddToCartButton } from "./add-to-cart-button";
import { VariantSelector } from "./variant-selector";
import { StickyCartBar } from "./sticky-cart-bar";
import { ImageGallery } from "@/components/products/image-gallery";
import { LucideIcon } from "@/components/lucide-icon";
import { RelatedProducts } from "@/components/products/related-products";
import { StarRating } from "@/components/products/star-rating";
import { ProductReviews } from "@/components/products/product-reviews";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/utils";
import type {
  StorefrontProductDetail,
  StorefrontProductGroup,
} from "@stadian/storefront-sdk";

/** Extended detail fields the API returns but the SDK types don't cover yet. */
type ProductDetailExtended = StorefrontProductDetail & {
  purity?: string | null;
  short_description?: string | null;
  key_highlights?: string[];
  requires_cold_chain?: boolean;
  requires_age_verification?: boolean;
  storage_temperature?: string | null;
  extended_description?: string | null;
  faqs?: { q: string; a: string }[];
  images?: string[];
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const client = getStadianClient();
    const product = await client.catalog.get(slug);
    const description = product.description?.slice(0, 160) || undefined;
    return {
      title: product.name,
      description,
      // Canonical to the product's own URL — matters because group slugs
      // redirect into product slugs, so several paths can show this product.
      alternates: { canonical: `/products/${slug}` },
      openGraph: {
        type: "website",
        title: product.name,
        description,
        url: `/products/${slug}`,
        images: product.image_url ? [{ url: product.image_url }] : undefined,
      },
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const client = getStadianClient();
  // Wholesale stores return prices only to signed-in buyers; a stale session
  // retries each call signed-out (prices hidden) instead of crashing/404ing.
  const pricesHidden = await arePricesHidden();

  let product: ProductDetailExtended | null = null;
  try {
    product = (await fetchWithOptionalAuth((customerToken) =>
      client.catalog.get(slug, { customerToken })
    )) as ProductDetailExtended;
  } catch {
    // Not a single product
  }

  if (!product) {
    let redirectSlug: string | null = null;
    try {
      const group = await fetchWithOptionalAuth((customerToken) =>
        client.productGroups.get(slug, { customerToken })
      );
      if (group.products.length > 0) {
        redirectSlug = group.products[0].slug;
      }
    } catch {
      // Not a group either
    }
    if (redirectSlug) {
      redirect(`/products/${redirectSlug}`);
    }
    notFound();
  }

  let group: StorefrontProductGroup | null = null;
  try {
    const groupsResult = await fetchWithOptionalAuth((customerToken) =>
      client.productGroups.list({ customerToken })
    );
    group =
      groupsResult.items.find((g) =>
        g.products.some((p) => p.id === product.id)
      ) ?? null;
  } catch {
    // No groups available
  }

  const displayName = group ? group.name : product.name;
  const discountTiers = product.volume_tiers.filter(
    (t) => t.discount_type && t.discount_value
  );

  // Build image array for gallery
  const galleryImages: string[] = [];
  if (product.images && product.images.length > 0) {
    galleryImages.push(...product.images);
  } else if (product.image_url) {
    galleryImages.push(product.image_url);
  }

  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/products/${slug}`;

  // Escape "<" so a stray "</script>" in product data can't break out of the
  // JSON-LD <script> tag (the standard safe serialization for ld+json).
  const ldJson = (obj: object) => JSON.stringify(obj).replace(/</g, "\\u003c");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image_url,
    // AggregateRating intentionally omitted until there are real reviews —
    // emitting review markup with zero reviews violates Google's guidelines.
    ...(product.price != null && {
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: product.currency || "USD",
        availability: "https://schema.org/InStock",
        url: productUrl,
      },
    }),
  };

  // Mirrors the visible breadcrumb nav below → breadcrumb rich result.
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Products", item: `${siteUrl}/products` },
      ...(product.categories?.[0]
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.categories[0].name,
              item: `${siteUrl}/products?category=${product.categories[0].slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.categories?.[0] ? 4 : 3,
        name: displayName,
        item: productUrl,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <script
        type="application/ld+json"
        // Safe: built from server-fetched API data; ldJson escapes "<".
        dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/products"
          className="transition-colors hover:text-foreground"
        >
          Products
        </Link>
        <span>/</span>
        {product.categories?.[0] && (
          <>
            <Link
              href={`/products?category=${product.categories[0].slug}`}
              className="transition-colors hover:text-foreground"
            >
              {product.categories[0].name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{displayName}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Product image gallery — sticky on desktop */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ImageGallery images={galleryImages} alt={product.name} />
        </div>

        {/* Product details */}
        <div className="flex flex-col">
          {/* Storefront badges (admin-configured) */}
          {product.badges && product.badges.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {product.badges.map((badge, i) => {
                const tokenStyles: Record<string, string> = {
                  success:
                    "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400",
                  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400",
                  warning:
                    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
                  danger:
                    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400",
                  default:
                    "border-border bg-muted/50 text-foreground",
                };
                const style =
                  tokenStyles[badge.color_token] ?? tokenStyles.default;

                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${style}`}
                  >
                    {badge.icon_name && (
                      <LucideIcon name={badge.icon_name} size={12} />
                    )}
                    {badge.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Category — above title for context */}
          {product.categories?.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {product.categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="text-xs font-medium uppercase tracking-widest transition-colors hover:opacity-70"
                  style={{ color: cat.color }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            {displayName}
          </h1>

          {/* Star rating — only renders when reviews exist */}
          {product.review_summary && (
            <div className="mt-2">
              <StarRating
                rating={product.review_summary.average_rating}
                count={product.review_summary.total_count}
              />
            </div>
          )}

          {/* Subtitle — show specific variant name if in a group */}
          {group && (
            <p className="mt-1 text-lg text-muted-foreground">
              {product.name}
            </p>
          )}

          {/* Short description */}
          {product.short_description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {product.short_description}
            </p>
          )}

          {/* Product badges */}
          {(product.purity ||
            product.requires_cold_chain ||
            product.requires_age_verification) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.purity && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  Potency {product.purity}
                </span>
              )}
              {product.requires_cold_chain && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                  Cold Chain
                </span>
              )}
              {product.requires_age_verification && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                  Age Verification
                </span>
              )}
            </div>
          )}

          {/* Price block */}
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            {pricesHidden ? (
              <SignInForPricing />
            ) : product.price != null ? (
              <>
                <span className="text-3xl font-bold tracking-tight">
                  {formatCurrency(product.price, product.currency)}
                </span>
                {product.compare_at_price != null &&
                  product.compare_at_price > product.price && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        {formatCurrency(
                          product.compare_at_price,
                          product.currency
                        )}
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        Save{" "}
                        {formatCurrency(
                          product.compare_at_price - product.price,
                          product.currency
                        )}{" "}
                        ({Math.round(
                          ((product.compare_at_price - product.price) /
                            product.compare_at_price) *
                            100
                        )}%)
                      </span>
                    </>
                  )}
              </>
            ) : (
              <span className="text-lg text-muted-foreground">
                Contact for pricing
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-border" />

          {/* Variant / dosage selector */}
          {group && group.products.length > 1 && (
            <div className="mb-6">
              <VariantSelector
                variants={group.products}
                currentProductId={product.id}
              />
            </div>
          )}

          {/* Volume pricing pills */}
          {discountTiers.length > 0 && product.price != null && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {discountTiers.map((tier, i) => {
                const discounted =
                  tier.discount_type === "percent"
                    ? product.price! * (1 - (tier.discount_value ?? 0) / 100)
                    : product.price! - (tier.discount_value ?? 0);

                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1 text-xs"
                  >
                    <span className="font-medium text-muted-foreground">
                      {tier.min_quantity}+
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(discounted, product.currency)}/ea
                    </span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Add to cart */}
          <div id="cart-button-area">
            {pricesHidden ? (
              <SignInForPricing
                variant="panel"
                redirectTo={`/products/${product.slug}`}
              />
            ) : product.price == null ? (
              <div className="rounded-xl border border-border bg-muted/30 p-5">
                <p className="text-sm font-semibold text-foreground">
                  Contact for pricing
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This product isn&apos;t available for online purchase yet.
                  Please contact us for availability and pricing.
                </p>
              </div>
            ) : (
              <AddToCartButton
                productId={product.id}
                inStock={product.in_stock}
                availableQuantity={product.available_quantity}
                minOrderQuantity={product.min_order_quantity}
                maxOrderQuantity={product.max_order_quantity}
              />
            )}
          </div>

          {/* Storefront trust_signals (admin-configured) */}
          {product.trust_signals && product.trust_signals.length > 0 && (
            <div className="mt-5 space-y-2">
              {product.trust_signals.map((banner, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  {banner.icon_name && (
                    <div className="mt-0.5 shrink-0 text-muted-foreground">
                      <LucideIcon name={banner.icon_name} size={18} />
                    </div>
                  )}
                  <div>
                  <p className="text-sm font-semibold text-foreground">
                    {banner.title}
                  </p>
                  {banner.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {banner.description}
                    </p>
                  )}
                  {banner.link_url && banner.link_text && (
                    <Link
                      href={banner.link_url}
                      className="mt-1 inline-block text-sm font-medium underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      {banner.link_text}
                    </Link>
                  )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Key highlights */}
          {product.key_highlights && product.key_highlights.length > 0 && (
            <>
              <div className="my-6 h-px bg-border" />
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Key Highlights
                </h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {product.key_highlights.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 shrink-0 text-foreground"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Accordion sections */}
          <div className="my-6 h-px bg-border" />
          <Accordion defaultValue={[0]} className="w-full">
            {product.description && (
              <AccordionItem>
                <AccordionTrigger className="text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:no-underline">
                  <span className="inline-flex items-center gap-2">
                    <LucideIcon name="package" size={14} />
                    About This Product
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {product.extended_description && (
              <AccordionItem>
                <AccordionTrigger className="text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:no-underline">
                  <span className="inline-flex items-center gap-2">
                    <LucideIcon name="info" size={14} />
                    More Details
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="leading-relaxed text-muted-foreground">
                    {product.extended_description}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Dynamic sections from field_schema */}
            {product.field_schema
              ?.filter((section) =>
                section.fields.some(
                  (f) =>
                    product.dynamic_fields?.[f.slug] != null &&
                    product.dynamic_fields[f.slug] !== ""
                )
              )
              .map((section) => {
                const fieldsWithValues = section.fields.filter(
                  (f) =>
                    product.dynamic_fields?.[f.slug] != null &&
                    product.dynamic_fields[f.slug] !== ""
                );

                return (
                  <AccordionItem key={section.slug}>
                    <AccordionTrigger className="text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:no-underline">
                      <span className="inline-flex items-center gap-2">
                        {section.icon && (
                          <LucideIcon name={section.icon} size={14} />
                        )}
                        {section.name}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <dl className="grid gap-2">
                        {fieldsWithValues.map((field) => {
                          const value = product.dynamic_fields![field.slug];
                          return (
                            <div key={field.slug} className="flex gap-2 text-sm">
                              <dt className="shrink-0 font-medium text-foreground">
                                {field.name}:
                              </dt>
                              <dd className="text-muted-foreground">
                                {field.field_type === "boolean"
                                  ? value
                                    ? "Yes"
                                    : "No"
                                  : String(value)}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>

          {/* Meta badges */}
          <div className="mt-6 flex flex-wrap gap-2">
            {product.form_type && (
              <span className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                {product.form_type}
              </span>
            )}
            {product.taxable && (
              <span className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Tax applicable
              </span>
            )}
          </div>

          {/* Public product documents (renders only when the platform
              provides them — nothing shows otherwise) */}
          {(product.coa_document_url ||
            (product.documents && product.documents.length > 0)) && (
            <div className="mt-6 rounded-md border border-border bg-muted/30 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-muted-foreground"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="m9 15 2 2 4-4" />
                </svg>
                <span className="text-sm font-medium text-foreground">
                  Documents
                </span>
                {product.coa_document_url && (
                  <a
                    href={product.coa_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground underline underline-offset-4"
                  >
                    Certificate of Analysis (PDF)
                  </a>
                )}
                {product.documents?.map((doc) =>
                  doc.url ? (
                    <a
                      key={doc.url}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      {doc.name || "Document (PDF)"}
                    </a>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews && product.reviews.length > 0 && product.review_summary && (
        <div className="mt-16 border-t border-border pt-10">
          <ProductReviews
            reviews={product.reviews}
            averageRating={product.review_summary.average_rating}
            totalCount={product.review_summary.total_count}
          />
        </div>
      )}

      {/* Related products */}
      <RelatedProducts
        currentProductId={product.id}
        categories={product.categories ?? []}
      />

      {/* Sticky mobile CTA */}
      {product.price != null && product.in_stock && (
        <StickyCartBar
          productName={displayName}
          price={product.price}
          currency={product.currency}
          productId={product.id}
        />
      )}
    </div>
  );
}

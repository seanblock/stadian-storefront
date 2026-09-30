import type { StorefrontCertificate, StorefrontProductDetail } from "@stadian/storefront-sdk";

export type ProductCoa = { url: string; name: string; lotNumber?: string | null };

type ProductDocument = NonNullable<StorefrontProductDetail["documents"]>[number];

// Documents open in a new tab; only allow web URLs or local asset paths.
function safeUrl(url: string | null | undefined): string | null {
  const normalized = url?.trim();
  return normalized && /^(https?:\/\/|\/(?!\/))/i.test(normalized) ? normalized : null;
}

/** Links for a resolved certificate list (product page or order line). */
export function toProductCoas(certificates: StorefrontCertificate[] | null | undefined): ProductCoa[] {
  const byUrl = new Map<string, ProductCoa>();
  for (const cert of certificates ?? []) {
    const url = safeUrl(cert.url);
    if (url && !byUrl.has(url)) {
      byUrl.set(url, { url, name: cert.name || "Certificate of Analysis", lotNumber: cert.lot_number ?? null });
    }
  }
  return [...byUrl.values()];
}

/**
 * The certificates to show for a product.
 *
 * The API resolves `certificates` — the in-stock lots' batch certificates,
 * else the product-level fallback — so that list is authoritative whenever it
 * is present. The legacy fields are only read against an API that predates it.
 */
export function getProductCoas(
  product: Pick<StorefrontProductDetail, "coa_document_url" | "documents"> &
    Partial<Pick<StorefrontProductDetail, "certificates">>
): ProductCoa[] {
  if (product.certificates) return toProductCoas(product.certificates);
  const legacy: StorefrontCertificate[] = [];
  if (product.coa_document_url) {
    legacy.push({ url: product.coa_document_url, name: "Certificate of Analysis", source: "product" });
  }
  for (const document of product.documents ?? []) {
    if (document.type === "coa") {
      legacy.push({ url: document.url, name: document.name || "Certificate of Analysis", source: "product" });
    }
  }
  return toProductCoas(legacy);
}

/** Non-certificate attachments (SDS, usage guides…). COAs render via getProductCoas. */
export function getOtherDocuments(
  product: Pick<StorefrontProductDetail, "documents">
): ProductDocument[] {
  return (product.documents ?? []).filter((document) => document.type !== "coa" && safeUrl(document.url));
}

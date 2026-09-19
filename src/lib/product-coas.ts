import type { StorefrontProductDetail } from "@stadian/storefront-sdk";

export type ProductCoa = { url: string; name: string };

/** Support the legacy certificate field and typed product attachments. */
export function getProductCoas(
  product: Pick<StorefrontProductDetail, "coa_document_url" | "documents">
): ProductCoa[] {
  const certificates = new Map<string, ProductCoa>();
  const add = (url: string, name: string) => {
    // Documents open in a new tab; only allow web URLs or local asset paths.
    const normalized = url.trim();
    if (!/^(https?:\/\/|\/(?!\/))/i.test(normalized)) return;
    if (!certificates.has(normalized)) {
      certificates.set(normalized, { url: normalized, name });
    }
  };
  if (product.coa_document_url) {
    add(product.coa_document_url, "Certificate of Analysis");
  }
  for (const document of product.documents ?? []) {
    if (document.type === "coa") {
      add(document.url, document.name || "Certificate of Analysis");
    }
  }
  return [...certificates.values()];
}

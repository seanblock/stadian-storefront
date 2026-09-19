import { describe, expect, it } from "vitest";
import { getProductCoas } from "./product-coas";

describe("getProductCoas", () => {
  it("includes legacy and typed certificates, deduplicating links and excluding other documents", () => {
    expect(getProductCoas({
      coa_document_url: "https://example.com/coa.pdf",
      documents: [
        { url: "https://example.com/coa.pdf", type: "coa" },
        { url: "/batch-two.pdf", type: "coa", name: "Batch two" },
        { url: "/sds.pdf", type: "sds", name: "Safety data" },
        { url: "/guide.pdf", name: "Guide" },
      ],
    })).toEqual([
      { url: "https://example.com/coa.pdf", name: "Certificate of Analysis" },
      { url: "/batch-two.pdf", name: "Batch two" },
    ]);
  });

  it("returns no certificates when none are attached", () => {
    expect(getProductCoas({ coa_document_url: null, documents: [] })).toEqual([]);
  });

  it("rejects executable and protocol-relative links", () => {
    expect(getProductCoas({ coa_document_url: "javascript:alert(1)", documents: [
      { url: "//example.com/coa.pdf", type: "coa" },
      { url: "data:text/html,test", type: "coa" },
    ] })).toEqual([]);
  });
});

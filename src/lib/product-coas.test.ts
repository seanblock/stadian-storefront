import { describe, expect, it } from "vitest";
import { getOtherDocuments, getProductCoas, toProductCoas } from "./product-coas";

describe("getProductCoas", () => {
  it("uses the API-resolved certificates when present, ignoring the legacy fields", () => {
    expect(getProductCoas({
      certificates: [
        { url: "https://cdn.example.com/coa/24A.pdf", name: "Certificate of Analysis — Lot 24A", source: "lot", lot_number: "24A" },
      ],
      coa_document_url: "https://example.com/generic.pdf",
      documents: [{ url: "/other-coa.pdf", type: "coa" }],
    })).toEqual([
      { url: "https://cdn.example.com/coa/24A.pdf", name: "Certificate of Analysis — Lot 24A", lotNumber: "24A" },
    ]);
  });

  it("an empty resolved list means none — it does not fall back to the legacy fields", () => {
    expect(getProductCoas({
      certificates: [],
      coa_document_url: "https://example.com/generic.pdf",
      documents: [],
    })).toEqual([]);
  });

  it("without resolved certificates, reads legacy and typed certificates, deduplicating links", () => {
    expect(getProductCoas({
      coa_document_url: "https://example.com/coa.pdf",
      documents: [
        { url: "https://example.com/coa.pdf", type: "coa" },
        { url: "/batch-two.pdf", type: "coa", name: "Batch two" },
        { url: "/sds.pdf", type: "sds", name: "Safety data" },
        { url: "/guide.pdf", name: "Guide" },
      ],
    })).toEqual([
      { url: "https://example.com/coa.pdf", name: "Certificate of Analysis", lotNumber: null },
      { url: "/batch-two.pdf", name: "Batch two", lotNumber: null },
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
    expect(toProductCoas([{ url: "javascript:alert(1)", name: "x", source: "lot", lot_number: "1" }])).toEqual([]);
  });
});

describe("getOtherDocuments", () => {
  it("keeps non-certificate attachments so a COA never shows twice", () => {
    expect(getOtherDocuments({ documents: [
      { url: "/coa.pdf", type: "coa" },
      { url: "/sds.pdf", type: "sds", name: "Safety data" },
      { url: "javascript:alert(1)", type: "other" },
    ] })).toEqual([{ url: "/sds.pdf", type: "sds", name: "Safety data" }]);
  });
});

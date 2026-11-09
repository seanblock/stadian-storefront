import { describe, expect, it } from "vitest";
import type { StorefrontBranding } from "@stadian/storefront-sdk";
import { getContactDetails } from "./contact-details";

const branding = (fields: Partial<StorefrontBranding>) => fields as StorefrontBranding;

describe("getContactDetails", () => {
  it("is null when nothing is published", () => {
    expect(getContactDetails(branding({}))).toBeNull();
  });

  it("is null for blank values", () => {
    expect(
      getContactDetails(branding({ contact_email: "  ", contact_phone: "", business_address: " \n " }))
    ).toBeNull();
  });

  it("is null for a legal name with no way to reach the store", () => {
    expect(getContactDetails(branding({ legal_business_name: "Example LLC" }))).toBeNull();
  });

  it("returns whichever details are published, trimmed", () => {
    expect(
      getContactDetails(
        branding({ legal_business_name: " Example LLC ", contact_email: " hello@example.com " })
      )
    ).toEqual({
      legalName: "Example LLC",
      email: "hello@example.com",
      phone: null,
      phoneHref: null,
      addressLines: null,
    });
  });

  it("splits the address into non-empty lines", () => {
    expect(
      getContactDetails(branding({ business_address: "1 Main St\r\n\n  Albany, NY 12207 " }))?.addressLines
    ).toEqual(["1 Main St", "Albany, NY 12207"]);
  });

  it("builds a dialable tel link, keeping a leading plus", () => {
    expect(getContactDetails(branding({ contact_phone: "+1 (555) 010-0100" }))?.phoneHref).toBe(
      "tel:+15550100100"
    );
    expect(getContactDetails(branding({ contact_phone: "555.010.0100" }))?.phoneHref).toBe(
      "tel:5550100100"
    );
  });

  it("shows a number it can't dial without linking it", () => {
    const details = getContactDetails(branding({ contact_phone: "ext 12" }));
    expect(details?.phone).toBe("ext 12");
    expect(details?.phoneHref).toBeNull();
  });
});

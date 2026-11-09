import { describe, expect, it } from "vitest";
import { isCatalogPublic, storeAccessFor } from "./store-access";

const newVisitor = { ageConfirmed: false, hasPreviewAccess: false };
const confirmed = { ageConfirmed: true, hasPreviewAccess: false };

describe("storeAccessFor", () => {
  it("shows the catalog on an open store with no gate", () => {
    expect(storeAccessFor({ storefront_enabled: true }, newVisitor)).toEqual({
      isClosed: false,
      ageGateActive: false,
      canViewCatalog: true,
    });
  });

  it("withholds the catalog until the visitor confirms their age", () => {
    const gated = { storefront_enabled: true, age_gate_enabled: true };
    expect(storeAccessFor(gated, newVisitor)).toEqual({
      isClosed: false,
      ageGateActive: true,
      canViewCatalog: false,
    });
    expect(storeAccessFor(gated, confirmed)).toEqual({
      isClosed: false,
      ageGateActive: false,
      canViewCatalog: true,
    });
  });

  it("withholds the catalog on a closed store, even from a confirmed visitor", () => {
    expect(storeAccessFor({ storefront_enabled: false }, confirmed)).toEqual({
      isClosed: true,
      ageGateActive: false,
      canViewCatalog: false,
    });
  });

  it("lets a preview visitor into a closed store, still behind the age gate", () => {
    const closedGated = { storefront_enabled: false, age_gate_enabled: true };
    expect(
      storeAccessFor(closedGated, { ageConfirmed: false, hasPreviewAccess: true })
    ).toEqual({ isClosed: false, ageGateActive: true, canViewCatalog: false });
    expect(
      storeAccessFor(closedGated, { ageConfirmed: true, hasPreviewAccess: true }).canViewCatalog
    ).toBe(true);
  });
});

describe("when branding couldn't be loaded", () => {
  it("withholds the catalog, even from a confirmed visitor", () => {
    expect(storeAccessFor({ storefront_enabled: true }, confirmed, true).canViewCatalog).toBe(false);
  });

  it("doesn't treat the catalog as public", () => {
    expect(isCatalogPublic({ storefront_enabled: true }, true)).toBe(false);
  });
});

describe("isCatalogPublic", () => {
  it("is true only for an open store with no age gate", () => {
    expect(isCatalogPublic({ storefront_enabled: true })).toBe(true);
    expect(isCatalogPublic({ storefront_enabled: true, age_gate_enabled: true })).toBe(false);
    expect(isCatalogPublic({ storefront_enabled: false })).toBe(false);
  });
});

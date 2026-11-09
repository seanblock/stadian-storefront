import { beforeEach, describe, expect, it } from "vitest";
import { hasPreviewAccess, makePreviewToken, previewGrantVersion } from "./preview-access";

const GRANT = "sfp1.1999999999.abc123version.deadbeef";

beforeEach(() => {
  process.env.STOREFRONT_PREVIEW_SECRET = "test-secret";
});

function localToken() {
  return makePreviewToken(Math.floor(Date.now() / 1000) + 3600);
}

describe("previewGrantVersion", () => {
  it("reads the password version from an API grant", () => {
    expect(previewGrantVersion(GRANT)).toBe("abc123version");
  });

  it("is null for anything that isn't a grant", () => {
    for (const junk of [undefined, null, "", "sfp1.1.2", "v1.1.sig", "sfp1.1..sig", `${GRANT}.extra`]) {
      expect(previewGrantVersion(junk)).toBeNull();
    }
  });
});

describe("hasPreviewAccess", () => {
  it("needs our signed cookie and a grant for the current password", () => {
    expect(hasPreviewAccess(localToken(), GRANT, "abc123version")).toBe(true);
  });

  it("drops access once the owner changes or clears the password", () => {
    expect(hasPreviewAccess(localToken(), GRANT, "newversion")).toBe(false);
    expect(hasPreviewAccess(localToken(), GRANT, null)).toBe(false);
  });

  it("drops visitors who unlocked before grants existed", () => {
    expect(hasPreviewAccess(localToken(), undefined, "abc123version")).toBe(false);
  });

  it("rejects a forged or expired local cookie", () => {
    expect(hasPreviewAccess("v1.1999999999.forged", GRANT, "abc123version")).toBe(false);
    expect(hasPreviewAccess(makePreviewToken(1), GRANT, "abc123version")).toBe(false);
  });
});

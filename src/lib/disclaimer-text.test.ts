import { describe, expect, it } from "vitest";
import { defaultFdaDisclaimer, renderDisclaimerText } from "./disclaimer-text";

describe("renderDisclaimerText", () => {
  it("renders tenant copy verbatim when it has no placeholder", () => {
    const copy = "Products are for adults 21+. Consult a physician before use.";
    expect(renderDisclaimerText(copy, "Acme")).toBe(copy);
  });

  it.each([
    "{store_name}",
    "{{store_name}}",
    "{storeName}",
    "${storeName}",
    "{ store_name }",
  ])("substitutes the store name for %s", (placeholder) => {
    expect(
      renderDisclaimerText(`Products sold by ${placeholder} are not medicine.`, "Acme"),
    ).toBe("Products sold by Acme are not medicine.");
  });

  it("substitutes every occurrence", () => {
    expect(renderDisclaimerText("{store_name} and {store_name}", "Acme")).toBe(
      "Acme and Acme",
    );
  });

  it("leaves unrelated braces alone", () => {
    expect(renderDisclaimerText("See {section 4}", "Acme")).toBe("See {section 4}");
  });
});

describe("defaultFdaDisclaimer", () => {
  it("names the store and carries the DSHEA wording", () => {
    const text = defaultFdaDisclaimer("Acme");
    expect(text).toContain("Products sold by Acme");
    expect(text).toContain("not been evaluated by the Food and Drug Administration");
  });
});

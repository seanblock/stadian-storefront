import { describe, expect, it } from "vitest";
import type { StorefrontFieldDef } from "@stadian/storefront-sdk";
import { formatDynamicFieldValue, richTextToPlain } from "./dynamic-field-value";

const field = (
  field_type: string,
  choices?: { value: string; label: string }[],
): StorefrontFieldDef => ({
  slug: "f",
  name: "F",
  field_type,
  options: choices ? { choices } : null,
});

describe("formatDynamicFieldValue", () => {
  it("resolves a select key to its label", () => {
    const f = field("select", [{ value: "sterile", label: "Sterile" }]);
    expect(formatDynamicFieldValue(f, "sterile")).toBe("Sterile");
  });

  it("resolves multi_select arrays and legacy comma strings", () => {
    const f = field("multi_select", [
      { value: "hplc", label: "HPLC" },
      { value: "ms", label: "Mass Spectrometry" },
    ]);
    expect(formatDynamicFieldValue(f, ["hplc", "ms"])).toBe("HPLC, Mass Spectrometry");
    expect(formatDynamicFieldValue(f, "hplc,ms")).toBe("HPLC, Mass Spectrometry");
  });

  it("falls back to the raw value for unknown keys and combobox free text", () => {
    expect(formatDynamicFieldValue(field("select", []), "gone")).toBe("gone");
    expect(formatDynamicFieldValue(field("combobox"), "Custom entry")).toBe("Custom entry");
  });

  it("formats booleans and plain values", () => {
    expect(formatDynamicFieldValue(field("boolean"), true)).toBe("Yes");
    expect(formatDynamicFieldValue(field("boolean"), false)).toBe("No");
    expect(formatDynamicFieldValue(field("number"), 12)).toBe("12");
    expect(formatDynamicFieldValue(field("text"), "White powder")).toBe("White powder");
  });

  it("returns null for empty and structured values", () => {
    expect(formatDynamicFieldValue(field("text"), "")).toBeNull();
    expect(formatDynamicFieldValue(field("multi_select"), [])).toBeNull();
    expect(formatDynamicFieldValue(field("json"), { a: 1 })).toBeNull();
    expect(formatDynamicFieldValue(field("table"), [{ a: 1 }])).toBeNull();
  });
});

describe("rich text", () => {
  it("renders editor HTML as plain text with line breaks", () => {
    const html = "<p>Store <strong>cold</strong> &amp; dry.</p><ul><li><p>Keep sealed</p></li><li>Use within 30 days</li></ul>";
    expect(formatDynamicFieldValue(field("rich_text"), html)).toBe(
      "Store cold & dry.\n• Keep sealed\n• Use within 30 days",
    );
  });

  it("treats empty editor output as no value", () => {
    expect(formatDynamicFieldValue(field("rich_text"), "<p></p>")).toBeNull();
  });

  it("never passes markup through", () => {
    expect(richTextToPlain('<img src=x onerror="alert(1)">Hi<script>x</script>')).toBe("Hix");
  });
});

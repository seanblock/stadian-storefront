import type { StorefrontFieldDef } from "@stadian/storefront-sdk";

const CHOICE_FIELD_TYPES = new Set(["select", "multi_select", "combobox"]);

/** Map of stored choice key → merchant-facing label from the product type. */
function choiceLabels(field: StorefrontFieldDef): Map<string, string> {
  const choices = field.options?.choices;
  const labels = new Map<string, string>();
  if (!Array.isArray(choices)) return labels;
  for (const c of choices) {
    if (c && typeof c === "object" && "value" in c) {
      const { value, label } = c as { value: unknown; label?: unknown };
      if (typeof value === "string" && typeof label === "string" && label.trim()) {
        labels.set(value, label);
      }
    }
  }
  return labels;
}

/**
 * Display text for a product's dynamic field value on the storefront.
 * Select-family fields store the choice KEY (`sterile`, `hplc`) — this
 * resolves it to the label defined in the product type editor ("Sterile",
 * "HPLC"), falling back to the raw value for combobox free text or choices
 * deleted since. Returns null for empty values and for structured types
 * (table/repeater/json/…) that don't reduce to a single line of text, so the
 * page never renders "[object Object]".
 */
export function formatDynamicFieldValue(
  field: StorefrontFieldDef,
  value: unknown,
): string | null {
  if (value == null || value === "") return null;

  if (field.field_type === "boolean") return value ? "Yes" : "No";

  if (CHOICE_FIELD_TYPES.has(field.field_type)) {
    const labels = choiceLabels(field);
    // multi_select is an array; tolerate legacy comma-joined strings too.
    const keys = Array.isArray(value)
      ? value
      : field.field_type === "multi_select" && typeof value === "string"
        ? value.split(",")
        : [value];
    const parts = keys
      .filter((k): k is string | number => typeof k === "string" || typeof k === "number")
      .map((k) => String(k).trim())
      .filter(Boolean)
      .map((k) => labels.get(k) ?? k);
    return parts.length ? parts.join(", ") : null;
  }

  if (field.field_type === "rich_text" && typeof value === "string") {
    return richTextToPlain(value) || null;
  }

  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value) && value.every((v) => typeof v === "string" || typeof v === "number")) {
    return value.length ? value.join(", ") : null;
  }
  return null;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  apos: "'",
  nbsp: " ",
};

/**
 * Rich-text fields hold editor HTML. The PDP renders values as text (React
 * escapes them), so reduce the markup to readable plain text: block ends and
 * <br> become line breaks, list items get a bullet, every other tag is dropped.
 * Render the result with `white-space: pre-line`.
 */
export function richTextToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|ul|ol)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e: string) => ENTITIES[e])
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n+(?=• )/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

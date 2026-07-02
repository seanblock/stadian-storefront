/**
 * Pure card-input helpers: brand detection + as-you-type formatting.
 * Kept framework-free so they're unit-testable in isolation. Authorize.Net's
 * Accept.js strips spaces and trims these values on read, so the display
 * formatting here never has to be undone before tokenization.
 */

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export function detectCardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return "visa";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^6(?:011|5|4[4-9])/.test(digits)) return "discover";
  return "unknown";
}

/** Group per brand: Amex is 15 digits (4-6-5); others 16 (4-4-4-4). */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (detectCardBrand(digits) === "amex") {
    const d = digits.slice(0, 15);
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  const d = digits.slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}

/** "1228" → "12 / 28"; keeps a single MM while typing. */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

/** Amex security code is 4 digits; everyone else is 3. */
export function cvvMaxLength(brand: CardBrand): number {
  return brand === "amex" ? 4 : 3;
}

export function formatCvv(value: string, maxLen: number): string {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

import { describe, it, expect } from "vitest";
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  formatCvv,
  cvvMaxLength,
} from "./card-format";

describe("detectCardBrand", () => {
  it("detects the major brands by prefix", () => {
    expect(detectCardBrand("4111111111111111")).toBe("visa");
    expect(detectCardBrand("5555555555554444")).toBe("mastercard");
    expect(detectCardBrand("2223003122003222")).toBe("mastercard"); // 2-series
    expect(detectCardBrand("378282246310005")).toBe("amex");
    expect(detectCardBrand("6011111111111117")).toBe("discover");
  });
  it("returns unknown for empty / unrecognized input", () => {
    expect(detectCardBrand("")).toBe("unknown");
    expect(detectCardBrand("9999")).toBe("unknown");
  });
});

describe("formatCardNumber", () => {
  it("groups a 16-digit card as 4-4-4-4 and caps at 16", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    // Extra digits beyond 16 are dropped (was the bug: 19 shown)
    expect(formatCardNumber("4111111111111111999")).toBe("4111 1111 1111 1111");
  });
  it("groups Amex as 4-6-5 and caps at 15", () => {
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
    expect(formatCardNumber("3782822463100050000")).toBe("3782 822463 10005");
  });
  it("strips non-digits and formats partials", () => {
    expect(formatCardNumber("4111-1111")).toBe("4111 1111");
    expect(formatCardNumber("37")).toBe("37");
  });
});

describe("formatExpiry", () => {
  it("inserts a slash after MM", () => {
    expect(formatExpiry("1")).toBe("1");
    expect(formatExpiry("12")).toBe("12");
    expect(formatExpiry("1228")).toBe("12 / 28");
    expect(formatExpiry("12/28")).toBe("12 / 28");
  });
});

describe("cvvMaxLength + formatCvv", () => {
  it("allows 4 digits for Amex, 3 otherwise", () => {
    expect(cvvMaxLength("amex")).toBe(4);
    expect(cvvMaxLength("visa")).toBe(3);
    expect(formatCvv("12345", cvvMaxLength("amex"))).toBe("1234");
    expect(formatCvv("12345", cvvMaxLength("visa"))).toBe("123");
    expect(formatCvv("1a2b", 3)).toBe("12");
  });
});

import { describe, expect, test } from "vitest";
import {
  availableModes,
  buildShipTo,
  isAddressComplete,
  paymentModeAvailability,
  soleAvailableMode,
  validateSaleAddress,
} from "./sale-logic";
import type { PaymentClientConfig } from "@/app/actions/payments";

const fullAddress = {
  line1: "1 Main St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  country: "US",
};

describe("validateSaleAddress", () => {
  test("complete address has no errors", () => {
    expect(validateSaleAddress(fullAddress)).toEqual({});
    expect(isAddressComplete(fullAddress)).toBe(true);
  });

  test("missing fields are reported individually", () => {
    const errors = validateSaleAddress({ ...fullAddress, line1: " ", zip: "" });
    expect(errors.line1).toBeTruthy();
    expect(errors.zip).toBeTruthy();
    expect(errors.city).toBeUndefined();
    expect(isAddressComplete({ ...fullAddress, line1: "" })).toBe(false);
  });
});

describe("availableModes", () => {
  const base: PaymentClientConfig = {
    gateway_enabled: true,
    gateway_type: "authorizenet",
    checkout_mode: "embedded",
    ach_enabled: false,
    js_library_url: "",
    public_key: "",
    form_config: {},
  };

  test("embedded gateway → card + invoice, no link", () => {
    expect(availableModes(base)).toEqual({ card: true, link: false, invoice: true });
  });

  test("redirect (pay-by-link) gateway → link + invoice, no on-page card", () => {
    expect(availableModes({ ...base, checkout_mode: "redirect" })).toEqual({
      card: false,
      link: true,
      invoice: true,
    });
  });

  test("no gateway at all → invoice only", () => {
    expect(availableModes(null)).toEqual({ card: false, link: false, invoice: true });
    expect(availableModes({ ...base, gateway_enabled: false }).card).toBe(false);
  });
});

describe("buildShipTo", () => {
  test("merges address with split customer name and contact", () => {
    const shipTo = buildShipTo(fullAddress, {
      name: "Jane Q Buyer",
      email: "jane@example.com",
      phone: "555-0100",
    });
    expect(shipTo).toMatchObject({
      ...fullAddress,
      first_name: "Jane",
      last_name: "Q Buyer",
      email: "jane@example.com",
      phone: "555-0100",
    });
  });

  test("handles missing name and phone", () => {
    const shipTo = buildShipTo(fullAddress, {
      name: null,
      email: "x@example.com",
      phone: null,
    });
    expect(shipTo.first_name).toBe("");
    expect(shipTo.last_name).toBe("");
    expect("phone" in shipTo).toBe(false);
  });
});

describe("paymentModeAvailability", () => {
  const modes = (card: boolean, link: boolean) => ({ card, link, invoice: true });

  test("a store with no gateway can only invoice — card and link are both disabled", () => {
    const a = paymentModeAvailability(modes(false, false), false);
    expect(a.card.available).toBe(false);
    expect(a.card.reason).toMatch(/set up/i);
    expect(a.link.available).toBe(false);
    expect(a.link.reason).toBeTruthy();
    expect(a.invoice.available).toBe(true);
    expect(soleAvailableMode(a)).toBe("invoice");
  });

  test("an embedded gateway enables card but not link", () => {
    const a = paymentModeAvailability(modes(true, false), false);
    expect(a.card.available).toBe(true);
    expect(a.card.reason).toBeNull();
    expect(a.link.available).toBe(false);
    expect(soleAvailableMode(a)).toBeNull(); // card + invoice
  });

  test("a link gateway enables link but not card", () => {
    const a = paymentModeAvailability(modes(false, true), false);
    expect(a.link.available).toBe(true);
    expect(a.card.available).toBe(false);
    expect(soleAvailableMode(a)).toBeNull();
  });

  test("while the config is loading nothing claims to be unsupported", () => {
    const a = paymentModeAvailability(modes(false, false), true);
    expect(a.card.available).toBe(false);
    expect(a.card.reason).toBeNull(); // disabled, but no misleading message
    expect(a.link.reason).toBeNull();
  });

  test("invoice never depends on a gateway", () => {
    for (const loading of [true, false]) {
      expect(paymentModeAvailability(modes(false, false), loading).invoice).toEqual({
        available: true,
        reason: null,
      });
    }
  });
});

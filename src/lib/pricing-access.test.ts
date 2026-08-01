import { describe, it, expect } from "vitest";
import { pricesHiddenFor, registrationShapeFor } from "./pricing-access";

describe("pricesHiddenFor", () => {
  it("shows prices on a normal retail store", () => {
    expect(pricesHiddenFor({}, false)).toBe(false);
    expect(pricesHiddenFor({ hide_prices_until_login: false }, false)).toBe(false);
  });

  it("hides prices from signed-out visitors on a wholesale store", () => {
    expect(pricesHiddenFor({ hide_prices_until_login: true }, false)).toBe(true);
  });

  it("shows prices to a signed-in buyer on a wholesale store", () => {
    expect(pricesHiddenFor({ hide_prices_until_login: true }, true)).toBe(false);
  });
});

describe("registrationShapeFor", () => {
  it("defaults to open, consumer-shaped sign-up", () => {
    expect(registrationShapeFor({})).toEqual({
      mode: "open",
      inviteOnly: false,
      requiresApproval: false,
      isWholesale: false,
    });
  });

  it("treats approval mode as a vetted business application", () => {
    expect(registrationShapeFor({ registration_mode: "approval" })).toEqual({
      mode: "approval",
      inviteOnly: false,
      requiresApproval: true,
      isWholesale: true,
    });
  });

  it("closes public sign-up in invite-only mode", () => {
    const shape = registrationShapeFor({ registration_mode: "invite_only" });
    expect(shape.inviteOnly).toBe(true);
    expect(shape.requiresApproval).toBe(false);
  });

  it("collects business details when pricing is gated, even with open sign-up", () => {
    const shape = registrationShapeFor({
      registration_mode: "open",
      hide_prices_until_login: true,
    });
    expect(shape.isWholesale).toBe(true);
    expect(shape.requiresApproval).toBe(false);
  });
});

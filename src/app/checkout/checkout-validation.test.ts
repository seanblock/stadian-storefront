import { describe, it, expect } from "vitest";
import { validateCheckout, type ValidateInput } from "./checkout-validation";

const VALID_SHIPPING = {
  line1: "123 Main St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  country: "US",
};

const VALID_INPUT: ValidateInput = {
  email: "user@example.com",
  shipping: VALID_SHIPPING,
  sameAsShipping: true,
};

describe("validateCheckout", () => {
  it("returns {} for fully valid input", () => {
    expect(validateCheckout(VALID_INPUT)).toEqual({});
  });

  // Email
  it("flags empty email", () => {
    const errors = validateCheckout({ ...VALID_INPUT, email: "" });
    expect(errors.email).toBe("Enter your email address.");
  });

  it("flags email with only whitespace", () => {
    const errors = validateCheckout({ ...VALID_INPUT, email: "   " });
    expect(errors.email).toBe("Enter your email address.");
  });

  it("flags malformed email 'foo@'", () => {
    const errors = validateCheckout({ ...VALID_INPUT, email: "foo@" });
    expect(errors.email).toBe("Enter a valid email address.");
  });

  it("flags malformed email 'notanemail'", () => {
    const errors = validateCheckout({ ...VALID_INPUT, email: "notanemail" });
    expect(errors.email).toBe("Enter a valid email address.");
  });

  it("accepts valid email", () => {
    const errors = validateCheckout({ ...VALID_INPUT, email: "hello@example.com" });
    expect(errors.email).toBeUndefined();
  });

  // Shipping address fields
  it("flags missing line1", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      shipping: { ...VALID_SHIPPING, line1: "" },
    });
    expect(errors.line1).toBe("Street address is required.");
  });

  it("flags missing city", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      shipping: { ...VALID_SHIPPING, city: "" },
    });
    expect(errors.city).toBe("City is required.");
  });

  it("flags missing state", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      shipping: { ...VALID_SHIPPING, state: "" },
    });
    expect(errors.state).toBe("Select a state.");
  });

  it("flags missing country", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      shipping: { ...VALID_SHIPPING, country: "" },
    });
    expect(errors.country).toBe("Select a country.");
  });

  it("flags missing zip", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      shipping: { ...VALID_SHIPPING, zip: "" },
    });
    expect(errors.zip).toBe("ZIP code is required.");
  });

  it("flags invalid US ZIP '1234'", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      shipping: { ...VALID_SHIPPING, zip: "1234", country: "US" },
    });
    expect(errors.zip).toBe("Enter a valid ZIP code (e.g. 94016).");
  });

  it("accepts valid US ZIP '94016'", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      shipping: { ...VALID_SHIPPING, zip: "94016", country: "US" },
    });
    expect(errors.zip).toBeUndefined();
  });

  it("accepts valid US ZIP+4 '94016-1234'", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      shipping: { ...VALID_SHIPPING, zip: "94016-1234", country: "US" },
    });
    expect(errors.zip).toBeUndefined();
  });

  it("does not validate ZIP format for non-US country", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      shipping: { ...VALID_SHIPPING, zip: "SW1A 1AA", country: "GB" },
    });
    expect(errors.zip).toBeUndefined();
  });

  // Billing address
  it("emits billing_* errors when sameAsShipping is false and billing is empty", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      sameAsShipping: false,
      billing: { line1: "", city: "", state: "", zip: "", country: "" },
    });
    expect(errors.billing_line1).toBe("Street address is required.");
    expect(errors.billing_city).toBe("City is required.");
    expect(errors.billing_state).toBe("Select a state.");
    expect(errors.billing_zip).toBe("ZIP code is required.");
    expect(errors.billing_country).toBe("Select a country.");
  });

  it("emits NO billing errors when sameAsShipping is true, even with empty billing", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      sameAsShipping: true,
      billing: { line1: "", city: "", state: "", zip: "", country: "" },
    });
    expect(errors.billing_line1).toBeUndefined();
    expect(errors.billing_city).toBeUndefined();
    expect(errors.billing_state).toBeUndefined();
    expect(errors.billing_zip).toBeUndefined();
    expect(errors.billing_country).toBeUndefined();
  });

  it("accepts valid billing address when sameAsShipping is false", () => {
    const errors = validateCheckout({
      ...VALID_INPUT,
      sameAsShipping: false,
      billing: { line1: "456 Oak Ave", city: "Denver", state: "CO", zip: "80202", country: "US" },
    });
    expect(errors.billing_line1).toBeUndefined();
    expect(errors.billing_city).toBeUndefined();
    expect(errors.billing_state).toBeUndefined();
    expect(errors.billing_zip).toBeUndefined();
    expect(errors.billing_country).toBeUndefined();
  });
});

export interface ValidateInput {
  email: string;
  shipping: { line1: string; city: string; state: string; zip: string; country: string };
  sameAsShipping: boolean;
  billing?: { line1: string; city: string; state: string; zip: string; country: string };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US_ZIP_RE = /^\d{5}(-\d{4})?$/;

function validateAddress(
  addr: { line1: string; city: string; state: string; zip: string; country: string },
  prefix: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const line1 = addr.line1.trim();
  const city = addr.city.trim();
  const state = addr.state.trim();
  const zip = addr.zip.trim();
  const country = addr.country.trim();

  if (!line1) errors[`${prefix}line1`] = "Street address is required.";
  if (!city) errors[`${prefix}city`] = "City is required.";
  if (!state) errors[`${prefix}state`] = "Select a state.";
  if (!country) {
    errors[`${prefix}country`] = "Select a country.";
  }
  if (!zip) {
    errors[`${prefix}zip`] = "ZIP code is required.";
  } else if (country === "US" && !US_ZIP_RE.test(zip)) {
    errors[`${prefix}zip`] = "Enter a valid ZIP code (e.g. 94016).";
  }

  return errors;
}

export function validateCheckout(input: ValidateInput): Record<string, string> {
  const errors: Record<string, string> = {};

  // Email
  const email = input.email.trim();
  if (!email) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  // Shipping address
  Object.assign(errors, validateAddress(input.shipping, ""));

  // Billing address (only when not same as shipping)
  if (!input.sameAsShipping && input.billing) {
    Object.assign(errors, validateAddress(input.billing, "billing_"));
  }

  return errors;
}

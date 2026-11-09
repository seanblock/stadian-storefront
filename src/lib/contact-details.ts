import type { StorefrontBranding } from "@stadian/storefront-sdk";

export interface ContactDetails {
  legalName: string | null;
  email: string | null;
  phone: string | null;
  /** tel: target, or null when the number can't be dialled as written. */
  phoneHref: string | null;
  addressLines: string[] | null;
}

const MIN_DIALABLE_DIGITS = 7;

function telHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < MIN_DIALABLE_DIGITS) return null;
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}

/**
 * What the store has published about how to reach it, or null when there is no
 * way to reach it yet. A legal name alone isn't enough to justify a contact page.
 */
export function getContactDetails(branding: StorefrontBranding): ContactDetails | null {
  const email = branding.contact_email?.trim() || null;
  const phone = branding.contact_phone?.trim() || null;
  const addressLines =
    branding.business_address
      ?.split("\n")
      .map((line) => line.trim())
      .filter(Boolean) ?? [];

  if (!email && !phone && addressLines.length === 0) return null;

  return {
    legalName: branding.legal_business_name?.trim() || null,
    email,
    phone,
    phoneHref: phone ? telHref(phone) : null,
    addressLines: addressLines.length > 0 ? addressLines : null,
  };
}

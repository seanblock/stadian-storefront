/**
 * Pure text helpers for tenant-authored disclaimers. Kept free of Next.js
 * imports so they can be unit-tested and shared by server and client code.
 */

/**
 * Placeholders a tenant may write into disclaimer copy to have the store name
 * dropped in at render time: `{store_name}`, `{{store_name}}`, `{storeName}`,
 * `${storeName}`. Text without a placeholder is rendered verbatim.
 */
const STORE_NAME_PLACEHOLDER = /\$?\{\{?\s*(?:store_name|storeName)\s*\}?\}/g;

export function renderDisclaimerText(content: string, storeName: string): string {
  return content.replace(STORE_NAME_PLACEHOLDER, storeName);
}

/** Wording shown when the tenant has not published an FDA disclaimer yet. */
export function defaultFdaDisclaimer(storeName: string): string {
  return `These statements have not been evaluated by the Food and Drug Administration. Products sold by ${storeName} are not intended to diagnose, treat, cure, or prevent any disease. Nothing on this site is medical advice.`;
}

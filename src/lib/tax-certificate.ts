export const CERTIFICATE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
/** Vercel caps function request bodies at 4.5 MB. */
export const MAX_CERTIFICATE_BYTES = 4 * 1024 * 1024;

const STATES = new Set(
  (
    "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY " +
    "NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR ALL"
  ).split(" "),
);

/** "ny, nj" → ["NY", "NJ"]; unknown codes are returned separately. */
export function parseCertificateStates(value: string): { states: string[]; invalid: string[] } {
  const parts = value.split(/[\s,]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);
  return {
    states: [...new Set(parts.filter((p) => STATES.has(p)))],
    invalid: parts.filter((p) => !STATES.has(p)),
  };
}

export const CERTIFICATE_STATUS_LABEL: Record<string, string> = {
  pending_review: "Under review",
  verified: "Verified",
  rejected: "Not accepted",
  revoked: "Revoked",
};

/** Registration's optional resale-certificate fields → the API payload, or
 *  undefined when the applicant left them blank or named no valid state. */
export function resaleExemption(statesText: string, certificateNumber: string) {
  const { states } = parseCertificateStates(statesText);
  if (!states.length) return undefined;
  return { states, certificateNumber: certificateNumber.trim() || undefined };
}

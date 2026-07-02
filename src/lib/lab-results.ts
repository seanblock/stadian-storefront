/**
 * Per-product COA (certificate of analysis) records for the Lab Results page.
 *
 * The page lists every product in the catalog automatically. Add an entry
 * here (keyed by product slug) as soon as a batch's COA comes back from the
 * lab — the page flips that row from "pending" to a published result with a
 * download link.
 *
 * To publish a COA:
 *   1. Drop the PDF in /public/coa/ (e.g. /public/coa/bpc-157-EP2601.pdf)
 *   2. Add or update the entry below.
 */

export interface CoaRecord {
  /** Batch/lot number printed on the vial label. */
  batch: string;
  /** Purity result from the COA, e.g. "99.4%". */
  purity: string;
  /** Name of the third-party lab that performed the analysis. */
  testedBy: string;
  /** Date on the certificate, ISO format (YYYY-MM-DD). */
  testedOn: string;
  /** Path to the COA PDF, e.g. "/coa/bpc-157-EP2601.pdf". */
  coaUrl: string;
}

/** Product slug → published COA records (newest first). */
export const COA_RECORDS: Record<string, CoaRecord[]> = {
  // Example (uncomment and edit when the first COA arrives):
  // "bpc-157-10mg": [
  //   {
  //     batch: "EP-2601",
  //     purity: "99.4%",
  //     testedBy: "Janoshik Analytical",
  //     testedOn: "2026-07-15",
  //     coaUrl: "/coa/bpc-157-EP2601.pdf",
  //   },
  // ],
};

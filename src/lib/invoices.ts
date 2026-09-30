import { getHttpClient } from "@/lib/stadian";

/**
 * A signed-in customer's issued invoices (GET /v1/storefront/invoices...).
 * Not yet wrapped by an SDK resource, so these go through the raw HTTP client.
 * Invoice emails link to /account/invoices/{id}; drafts never appear here.
 */

export type InvoicePaymentState = "open" | "overdue" | "paid" | "void";

export const INVOICE_STATE_LABELS: Record<InvoicePaymentState, string> = {
  open: "Due",
  overdue: "Overdue",
  paid: "Paid",
  void: "Void",
};

export interface InvoiceSummary {
  id: string;
  invoice_number: string;
  /** Where the customer stands — not the store's internal pipeline step. */
  status: InvoicePaymentState;
  total: number;
  amount_paid: number;
  balance_due: number;
  due_date: string;
  issued_at: string;
  has_pdf: boolean;
}

export interface InvoiceList {
  items: InvoiceSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface InvoiceDetail extends InvoiceSummary {
  payment_terms: string;
  subtotal: number;
  adjustments: number;
  shipping: number;
  tax: number;
  processing_fee: number;
  additional_fees: number;
  additional_fees_label: string | null;
  discount: number;
  orders: { id: string; order_number: string | null }[];
  payments: { amount: number; payment_method: string; paid_at: string }[];
}

function auth(customerToken: string) {
  return { headers: { Authorization: `Bearer ${customerToken}` } };
}

export function listInvoices(customerToken: string, params: { limit: number; offset: number }): Promise<InvoiceList> {
  return getHttpClient().request<InvoiceList>("GET", "/invoices", { ...auth(customerToken), query: params });
}

export function getInvoice(customerToken: string, invoiceId: string): Promise<InvoiceDetail> {
  return getHttpClient().request<InvoiceDetail>(
    "GET",
    `/invoices/${encodeURIComponent(invoiceId)}`,
    auth(customerToken),
  );
}

/** A presigned PDF link, minted per call and valid for minutes — redirect to it, never store it. */
export async function getInvoicePdfUrl(customerToken: string, invoiceId: string): Promise<string> {
  const { download_url } = await getHttpClient().request<{ download_url: string }>(
    "GET",
    `/invoices/${encodeURIComponent(invoiceId)}/pdf`,
    auth(customerToken),
  );
  return download_url;
}

export function paymentTermsLabel(terms: string): string {
  const labels: Record<string, string> = {
    prepay: "Due on receipt",
    net_15: "Net 15",
    net_30: "Net 30",
    net_60: "Net 60",
  };
  return labels[terms] ?? terms.replace(/_/g, " ");
}

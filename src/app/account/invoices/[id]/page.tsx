import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { StadianAuthError } from "@stadian/storefront-sdk";
import { fetchWithRequiredAuth } from "@/lib/authed-fetch";
import { INVOICE_STATE_LABELS, getInvoice, paymentTermsLabel } from "@/lib/invoices";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Invoice" };

interface PageProps {
  params: Promise<{ id: string }>;
}

function Line({ label, amount, strong }: { label: string; amount: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{formatCurrency(amount)}</dd>
    </div>
  );
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Invoice emails land here. A missing or lapsed session goes to /login and
  // comes back; anything else (someone else's invoice, a draft, an unknown id)
  // is a 404. Auth errors are rethrown so the login redirect wins.
  const invoice = await fetchWithRequiredAuth(`/account/invoices/${id}`, async (customerToken) => {
    try {
      return await getInvoice(customerToken, id);
    } catch (err) {
      if (err instanceof StadianAuthError) throw err;
      return null;
    }
  });

  if (!invoice) notFound();

  const date = (value: string) => new Date(value).toLocaleDateString();
  const paid = invoice.balance_due <= 0;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/account/invoices" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; All invoices
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Invoice {invoice.invoice_number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Issued {date(invoice.issued_at)} &middot; Due {date(invoice.due_date)} &middot;{" "}
            {paymentTermsLabel(invoice.payment_terms)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={invoice.status === "overdue" ? "destructive" : "secondary"}>{INVOICE_STATE_LABELS[invoice.status]}</Badge>
          {invoice.has_pdf && (
            // A route handler mints a fresh presigned link per click, so this
            // never goes stale the way a link baked into the page would.
            <a
              href={`/account/invoices/${encodeURIComponent(invoice.id)}/pdf`}
              target="_blank"
              rel="noopener"
              className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Download PDF
            </a>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-2 text-sm">
            <Line label="Subtotal" amount={invoice.subtotal} />
            {invoice.adjustments !== 0 && <Line label="Adjustments" amount={invoice.adjustments} />}
            <Line label="Shipping" amount={invoice.shipping} />
            <Line label="Tax" amount={invoice.tax} />
            {invoice.processing_fee > 0 && <Line label="Processing fee" amount={invoice.processing_fee} />}
            {invoice.additional_fees > 0 && (
              <Line
                label={invoice.additional_fees_label ? `Fees (${invoice.additional_fees_label})` : "Fees"}
                amount={invoice.additional_fees}
              />
            )}
            {invoice.discount > 0 && <Line label="Discount" amount={-invoice.discount} />}
            <div className="my-1 border-t" />
            <Line label="Total" amount={invoice.total} strong />
            {invoice.amount_paid > 0 && <Line label="Paid" amount={-invoice.amount_paid} />}
            <Line label={paid ? "Balance" : "Balance due"} amount={Math.max(invoice.balance_due, 0)} strong />
          </dl>
        </CardContent>
      </Card>

      {invoice.orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {invoice.orders.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="underline underline-offset-2">
                Order #{order.order_number ?? order.id.slice(0, 8)}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-sm">
              {invoice.payments.map((payment, index) => (
                <div key={index} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {date(payment.paid_at)} &middot; <span className="capitalize">{payment.payment_method.replace(/_/g, " ")}</span>
                  </dt>
                  <dd className="tabular-nums">{formatCurrency(payment.amount)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

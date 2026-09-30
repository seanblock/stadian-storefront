import Link from "next/link";
import type { Metadata } from "next";
import { fetchWithRequiredAuth } from "@/lib/authed-fetch";
import { INVOICE_STATE_LABELS, listInvoices } from "@/lib/invoices";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage({ searchParams }: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const { offset: rawOffset } = await searchParams;
  const parsedOffset = Number(rawOffset ?? 0);
  const offset = Number.isSafeInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
  const limit = 20;
  // Account-only surface: a missing or lapsed session goes to /login.
  const invoices = await fetchWithRequiredAuth("/account/invoices", (customerToken) =>
    listInvoices(customerToken, { limit, offset })
  );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invoices we&rsquo;ve issued to your account.
        </p>
      </div>

      {invoices.total === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No invoices</CardTitle>
            <CardDescription>
              When we send you an invoice, it will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {invoices.items.map((invoice) => (
            <Link key={invoice.id} href={`/account/invoices/${invoice.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={invoice.status === "overdue" ? "destructive" : "secondary"}>{INVOICE_STATE_LABELS[invoice.status]}</Badge>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium tabular-nums">{formatCurrency(invoice.total)}</span>
                      {invoice.balance_due > 0 && invoice.balance_due < invoice.total && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(invoice.balance_due)} due
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {invoices.total > limit && (
        <nav aria-label="Invoice pages" className="flex items-center justify-between gap-4 text-sm">
          {offset > 0 ? (
            <Link className="underline" href={`/account/invoices?offset=${Math.max(0, offset - limit)}`}>Previous</Link>
          ) : <span />}
          <span>{invoices.total} invoices</span>
          {offset + limit < invoices.total ? (
            <Link className="underline" href={`/account/invoices?offset=${offset + limit}`}>Next</Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}

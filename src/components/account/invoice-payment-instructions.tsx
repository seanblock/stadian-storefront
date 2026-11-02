import type { InvoiceBankTransfer } from "@/lib/invoices";
import { formatCurrency } from "@/lib/utils";

/**
 * How to pay an invoice by bank transfer. All rails pay into the same account,
 * so the account is shown once with a routing number per rail (ACH, wire).
 */
export function InvoicePaymentInstructions({ rails }: { rails: InvoiceBankTransfer[] }) {
  if (rails.length === 0) return null;
  const [first] = rails;
  const demo = rails.some((rail) => rail.demo_mode);
  const routing =
    rails.length === 1
      ? [{ label: "Routing number", value: first.details.routing_number }]
      : rails.map((rail) => ({
          label: `${rail.key.endsWith("_wire") ? "Wire" : "ACH"} routing number`,
          value: rail.details.routing_number,
        }));
  const fields = [
    ...(rails.length === 1 ? [{ label: "Transfer type", value: first.label, copy: false }] : []),
    { label: "Amount due", value: formatCurrency(Number(first.amount)), copy: false },
    { label: "Bank name", value: first.details.bank_name, copy: false },
    { label: "Account holder", value: first.details.account_name, copy: false },
    { label: "Account number", value: first.details.account_number, copy: true },
    ...routing.map((row) => ({ ...row, copy: true })),
    { label: "Payment reference / memo", value: first.reference, copy: true },
  ];

  return (
    <div className="grid gap-4 text-sm">
      {demo && (
        <p className="rounded-md border-2 border-current p-3 font-semibold" role="status">
          Demo only — do not send money. These bank details are fictional.
        </p>
      )}
      <p>Pay by bank transfer from your own bank using the details below.</p>
      <dl className="grid gap-3">
        {fields.map((field) => (
          <div key={field.label} className="grid gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</dt>
            <dd className={field.copy ? "break-all font-mono font-semibold select-all" : "font-semibold"}>
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
      <p>
        Put <strong>{first.reference}</strong> in your transfer memo so we can match your payment to this invoice.
        Sending a transfer does not mark the invoice paid right away; we update it once the payment arrives.
      </p>
      <p className="text-xs text-muted-foreground">
        If someone asks you to use different bank details, contact us through a known contact method before sending
        money.
      </p>
    </div>
  );
}

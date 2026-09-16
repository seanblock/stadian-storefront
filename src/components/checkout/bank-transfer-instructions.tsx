import { manualFieldLabel } from "./manual-payment";

export interface BankTransferDetails {
  key: string;
  label: string;
  demo_mode: boolean;
  details: Record<string, string>;
  amount: string;
  currency: string;
  reference: string;
}

export function BankTransferInstructions({ instructions }: { instructions: BankTransferDetails }) {
  return (
    <div className="space-y-4">
      {instructions.demo_mode && (
        <p className="rounded-md border-2 border-current p-3 font-semibold" role="status">
          Demo only — do not send money. These bank details are fictional.
        </p>
      )}
      <p>
        Pay by <strong>{instructions.label}</strong> from your own bank using the details below.
        Your order remains awaiting payment until our team verifies receipt.
      </p>
      <dl className="space-y-2">
        {Object.entries(instructions.details).map(([field, value]) => (
          <div key={field} className="flex flex-wrap gap-x-2">
            <dt className="font-medium">{manualFieldLabel(field)}:</dt>
            <dd className="break-all select-all">{value}</dd>
          </div>
        ))}
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium">Amount:</dt>
          <dd>{new Intl.NumberFormat("en-US", { style: "currency", currency: instructions.currency }).format(Number(instructions.amount))}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium">Payment reference / memo:</dt>
          <dd className="select-all">{instructions.reference}</dd>
        </div>
      </dl>
      <p>Include this reference so we can match your payment. Sending a transfer does not immediately mark your order paid.</p>
      <p className="text-xs">If someone asks you to use different bank details, contact us through a known contact method before sending money.</p>
    </div>
  );
}

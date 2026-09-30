import type { StorefrontOrder } from "@stadian/storefront-sdk";
import { formatCurrency } from "@/lib/utils";
import { toProductCoas } from "@/lib/product-coas";
import { orderTaxLabel } from "@/lib/tax-display";

export function OrderReceipt({ order, totalLabel = "Total" }: {
  order: Pick<StorefrontOrder, "items" | "shipping_address" | "subtotal" | "discount_amount" | "shipping_amount" | "tax_amount" | "tax_status" | "tax_label" | "processing_fee" | "total" | "refund_amount" | "refund_status" | "refunded_at">;
  totalLabel?: string;
}) {
  const address = order.shipping_address;
  return (
    <div className="flex flex-col gap-4 text-sm">
      {!!order.items?.length && (
        <ul aria-label="Ordered items" className="divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0">
              <div className="min-w-0">
                <p className="break-words font-medium">{item.product_name}</p>
                <p className="mt-1 text-muted-foreground">Qty {item.quantity} × {formatCurrency(item.unit_price)}</p>
                {toProductCoas(item.certificates).map((certificate) => (
                  <a key={certificate.url} href={certificate.url} target="_blank" rel="noopener noreferrer"
                    className="mt-1 block break-words text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    {certificate.name}<span className="sr-only"> for {item.product_name} (opens in a new tab)</span>
                  </a>
                ))}
              </div>
              <span className="shrink-0 tabular-nums">{formatCurrency(item.line_total)}</span>
            </li>
          ))}
        </ul>
      )}
      {address && (
        <section aria-label="Delivery address" className="border-t border-border pt-4">
          <h3 className="font-medium">Ship to</h3>
          <address className="mt-1 break-words not-italic text-muted-foreground">
            <div>{[address.first_name, address.last_name].filter(Boolean).join(" ")}</div>
            <div>{address.line1}</div>
            {address.line2 && <div>{address.line2}</div>}
            <div>{[address.city, address.state, address.zip].filter(Boolean).join(", ")}</div>
            <div>{address.country}</div>
          </address>
        </section>
      )}
      <dl className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex justify-between gap-4"><dt>Subtotal</dt><dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd></div>
        {order.discount_amount > 0 && <div className="flex justify-between gap-4"><dt>Discount</dt><dd className="tabular-nums">−{formatCurrency(order.discount_amount)}</dd></div>}
        <div className="flex justify-between gap-4"><dt>Shipping</dt><dd className="tabular-nums">{order.shipping_amount === undefined ? "Included in total" : order.shipping_amount === 0 ? "Free ($0.00)" : formatCurrency(order.shipping_amount)}</dd></div>
        <div className="flex justify-between gap-4"><dt>{orderTaxLabel(order)}</dt><dd className="tabular-nums">{formatCurrency(order.tax_amount)}</dd></div>
        {!!order.processing_fee && <div className="flex justify-between gap-4"><dt>Processing fee</dt><dd className="tabular-nums">{formatCurrency(order.processing_fee)}</dd></div>}
        <div className="mt-1 flex justify-between gap-4 border-t border-border pt-3 font-semibold"><dt>{totalLabel}</dt><dd className="tabular-nums">{formatCurrency(order.total)}</dd></div>
      </dl>
      {!!order.refund_amount && order.refund_amount > 0 && (
        <section aria-label="Refund record" className="rounded-lg border border-border p-4">
          <h3 className="font-medium">{!order.refunded_at ? "Refund awaiting confirmation" : order.refund_status === "full" ? "Full refund recorded" : "Partial refund recorded"}</h3>
          <p className="mt-1">{formatCurrency(order.refund_amount)} {order.refunded_at ? "refunded against this order." : "is awaiting refund confirmation from the store."}</p>
          <p className="mt-1 text-muted-foreground">This reflects the store’s refund record. Contact the store if you need help confirming receipt.</p>
        </section>
      )}
    </div>
  );
}

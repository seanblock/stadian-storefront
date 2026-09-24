import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getHttpClient, getStadianClient } from "@/lib/stadian";
import { fetchWithRequiredAuth } from "@/lib/authed-fetch";
import { StadianAuthError } from "@stadian/storefront-sdk";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTracking } from "@/components/checkout/order-tracking";
import { OrderReceipt } from "@/components/checkout/order-receipt";
import { orderPaymentState } from "@/lib/order-payment-state";
import { BankTransferInstructions, type BankTransferDetails } from "@/components/checkout/bank-transfer-instructions";
import { getManualPaymentMethods } from "@/app/actions/payments";
import {
  hasMaskedDetail,
  manualFieldLabel,
} from "@/components/checkout/manual-payment";

export const metadata: Metadata = { title: "Order Details" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Account-only surface: a missing or lapsed session goes to /login; any
  // other failure (wrong customer, unknown id) is a 404. Auth errors are
  // rethrown to the wrapper so the login redirect wins over notFound().
  const order = await fetchWithRequiredAuth(
    `/account/orders/${id}`,
    async (customerToken) => {
      try {
        return await getStadianClient().orders.get({ orderId: id, customerToken });
      } catch (err) {
        if (err instanceof StadianAuthError) throw err;
        return null;
      }
    }
  );

  if (!order) notFound();

  const showPaymentWarning =
    order.status === "pending" || order.status === "pending_payment";

  // For an order awaiting an offline payment, look up the details for the
  // method the buyer chose. This page is where a logged-in buyer lands after
  // checkout, so it — not just the emailed copy — has to tell them how to pay.
  const isBankTransfer = order.payment_method?.startsWith("bank_transfer_");
  const bankTransfer = showPaymentWarning && isBankTransfer
    ? await fetchWithRequiredAuth(`/account/orders/${id}`, async (customerToken) => {
        // Same contract as the order fetch: auth errors redirect to login, anything
        // else degrades to "no instructions" rather than replacing a loaded order.
        try {
          return await getHttpClient().request<BankTransferDetails | null>(
            "GET",
            `/orders/${encodeURIComponent(id)}/bank-transfer`,
            { headers: { Authorization: `Bearer ${customerToken}` } }
          );
        } catch (err) {
          if (err instanceof StadianAuthError) throw err;
          return null;
        }
      })
    : null;
  const manualMethod = showPaymentWarning && !isBankTransfer && order.payment_method
    ? (await getManualPaymentMethods()).find((m) => m.key === order.payment_method)
    : undefined;
  const isCancelled = order.status === "cancelled";
  const headerIcon = isCancelled ? "M6 18 18 6 M6 6l12 12" : "M20 6 9 17l-5-5";
  const headerColor = isCancelled
    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
    : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
  const headerTitle = isCancelled ? "Order Cancelled" : "Order Details";

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${headerColor}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={headerIcon} />
          </svg>
        </div>
        <h1 className="font-heading text-3xl font-semibold">{headerTitle}</h1>
        {order.order_number && (
          <p className="text-sm text-muted-foreground">
            Order <span className="font-medium text-foreground">#{order.order_number}</span>
          </p>
        )}
        <Badge variant="secondary" className="capitalize">
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="flex flex-col gap-4">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderReceipt order={order} totalLabel={orderPaymentState(order).totalLabel} />
          </CardContent>
        </Card>

        {/* Payment Instructions — only for pending statuses */}
        {showPaymentWarning && (
          <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" x2="12" y1="9" y2="13" />
                  <line x1="12" x2="12.01" y1="17" y2="17" />
                </svg>
                Payment Required
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-yellow-800 dark:text-yellow-300">
              {bankTransfer ? <BankTransferInstructions instructions={bankTransfer} /> : manualMethod ? (
                <>
                  <p className="mb-3">
                    We&rsquo;ve reserved your items. Send your payment by{" "}
                    <strong>{manualMethod.label}</strong>{" "}using the details below
                    and we&rsquo;ll start preparing your order as soon as it
                    arrives.
                  </p>
                  {manualMethod.customer_instructions && (
                    <p className="mb-3">{manualMethod.customer_instructions}</p>
                  )}
                  <dl className="flex flex-col gap-1.5">
                    {Object.entries(manualMethod.details).map(([field, value]) => (
                      <div key={field} className="flex flex-wrap gap-x-2">
                        <dt className="font-medium">{manualFieldLabel(field)}:</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="font-medium">Amount:</dt>
                      <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="font-medium">Reference / memo:</dt>
                      <dd>Order {order.order_number ?? order.id.slice(0, 8)}</dd>
                    </div>
                    {hasMaskedDetail(manualMethod.details) && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Part of these details is hidden for security. The full
                        account details are in your confirmation email.
                      </p>
                    )}
                  </dl>
                  <p className="mt-3">
                    Include the order number as the payment reference so we can
                    match your payment.
                  </p>
                </>
              ) : (
                <p>
                  Your order has been received but payment has not yet been
                  collected. Please complete your payment according to the
                  instructions provided by the store. Your order will be processed
                  once payment is confirmed.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <OrderTracking order={order} />

        {/* Continue Shopping */}
        <div className="mt-2 text-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

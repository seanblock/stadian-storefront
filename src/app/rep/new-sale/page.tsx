"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import type {
  RepCheckoutResponse,
  RepCustomer,
  ShippingOption,
  StorefrontProduct,
} from "@stadian/storefront-sdk";
import { useRepSale } from "@/providers/rep-sale-provider";
import {
  createRepOrder,
  getRepCustomer,
  getRepProducts,
  resendPaymentLink,
} from "@/app/actions/rep";
import { getPaymentConfig, type PaymentClientConfig } from "@/app/actions/payments";
import { getShippingOptions } from "@/app/actions/shipping";
import { formatCheckoutError, type Address } from "@/app/checkout/checkout-logic";
import {
  PaymentSection,
  type PaymentSectionHandle,
} from "@/components/checkout/payment-section";
import { AddressFields } from "@/components/checkout/address-fields";
import { CustomerSearch } from "@/components/rep/customer-search";
import { CustomerCreateDialog } from "@/components/rep/customer-create-dialog";
import { ProductPad } from "@/components/rep/product-pad";
import { SaleCartRail } from "@/components/rep/sale-cart-rail";
import { PaymentModeCards, type PaymentMode } from "@/components/rep/payment-mode-cards";
import { PayLinkResult } from "@/components/rep/pay-link-result";
import { fmtCurrency } from "@/components/rep/format";
import {
  availableModes,
  buildShipTo,
  validateSaleAddress,
  type SaleStep,
} from "./sale-logic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight } from "lucide-react";

const GOLD = "#d4a951";
const NAVY = "#0a1a2e";

const STEP_TITLES: Record<Exclude<SaleStep, "done">, string> = {
  customer: "Customer",
  cart: "Build order",
  shipping: "Shipping",
  payment: "Payment",
};

export default function NewSalePage() {
  const sale = useRepSale();
  const {
    saleSessionId,
    customer,
    cart,
    cartBusy,
    startSale,
    selectCustomer,
    addItem,
    updateItem,
    removeItem,
    applyCode,
    clearSale,
  } = sale;

  const [step, setStep] = useState<SaleStep>("customer");
  const [products, setProducts] = useState<StorefrontProduct[] | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentClientConfig | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState<string | undefined>();
  const [mode, setMode] = useState<PaymentMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addressErrors, setAddressErrors] = useState<Record<string, string | undefined>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmInvoice, setConfirmInvoice] = useState(false);
  const [disclaimersConfirmed, setDisclaimersConfirmed] = useState(true);
  const [result, setResult] = useState<RepCheckoutResponse | null>(null);
  const [discountEntry, setDiscountEntry] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const paymentRef = useRef<PaymentSectionHandle>(null);

  // A sale needs a session before anything else happens.
  useEffect(() => {
    if (!saleSessionId && !result) startSale();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Resume a persisted sale mid-flow — render-time state adjustment (the
  // React-endorsed alternative to a setState-in-effect).
  const [prevCustomerId, setPrevCustomerId] = useState<string | null>(null);
  if ((customer?.id ?? null) !== prevCustomerId) {
    setPrevCustomerId(customer?.id ?? null);
    if (customer && step === "customer" && !result) setStep("cart");
  }

  useEffect(() => {
    getRepProducts().then((r) => setProducts(r.ok ? r.data : []));
    getPaymentConfig().then(setPaymentConfig);
  }, []);

  // Shipping options depend on the cart's contents.
  useEffect(() => {
    if (step !== "shipping" || !saleSessionId) return;
    getShippingOptions(saleSessionId).then((options) => {
      setShippingOptions(options);
      setShippingMethodId((current) => current ?? options[0]?.method_id);
    });
  }, [step, saleSessionId, cart?.items.length]);

  const modes = useMemo(() => availableModes(paymentConfig), [paymentConfig]);

  const handleSelectCustomer = useCallback(
    async (next: RepCustomer) => {
      setError(null);
      try {
        // Fetch the detail (includes last ship-to for prefill).
        const detail = await getRepCustomer(next.id);
        await selectCustomer(detail.ok ? detail.data : next);
        setStep("cart");
        const shipTo = detail.ok ? detail.data.last_ship_to : null;
        if (shipTo) {
          // AddressFields is uncontrolled; prefill imperatively after render.
          requestAnimationFrame(() => {
            for (const key of ["line1", "line2", "city", "state", "zip", "country"]) {
              const el = document.getElementById(`rep-ship-${key}`) as HTMLInputElement | null;
              const value = shipTo[key];
              if (el && typeof value === "string" && !el.value) el.value = value;
            }
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not select customer");
      }
    },
    [selectCustomer]
  );

  const readShippingAddress = useCallback((): Address => {
    const data = formRef.current ? new FormData(formRef.current) : null;
    return {
      line1: String(data?.get("line1") ?? ""),
      line2: String(data?.get("line2") ?? "") || undefined,
      city: String(data?.get("city") ?? ""),
      state: String(data?.get("state") ?? ""),
      zip: String(data?.get("zip") ?? ""),
      country: String(data?.get("country") ?? "") || "US",
    };
  }, []);

  const goToPayment = useCallback(() => {
    const address = readShippingAddress();
    const errors = validateSaleAddress(address);
    setAddressErrors(errors);
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep("payment");
  }, [readShippingAddress]);

  const placeOrder = useCallback(
    async (chosenMode: PaymentMode) => {
      if (!saleSessionId || !customer) return;
      setError(null);
      setSubmitting(true);
      try {
        let paymentToken: string | undefined;
        let paymentType: "card" | "ach" | undefined;
        let billingAddress: Address | undefined;

        if (chosenMode === "card") {
          const paymentData = await paymentRef.current?.getPaymentData();
          if (!paymentData?.paymentToken) {
            setError("Enter the card details to charge the customer.");
            return;
          }
          paymentToken = paymentData.paymentToken;
          paymentType = paymentData.paymentType;
          const billing = paymentRef.current?.getBillingState();
          billingAddress = billing?.sameAsShipping ? undefined : billing?.billingAddress;
        }

        const shipping = readShippingAddress();
        const shipTo = buildShipTo(shipping, customer) as Address & Record<string, unknown>;

        const response = await createRepOrder({
          sessionToken: saleSessionId,
          customerId: customer.id,
          shippingAddress: shipTo,
          billingAddress,
          shippingMethodId,
          mode: chosenMode,
          paymentToken,
          paymentType,
          acceptDisclaimers: disclaimersConfirmed,
          sendPaymentLinkEmail: chosenMode === "link",
        });

        if (!response.ok) {
          setError(formatCheckoutError(response));
          return;
        }
        if (response.data.payment_status === "failed") {
          setError(
            response.data.payment_error ||
              "The card was declined. Please try another payment method."
          );
          return;
        }

        setResult(response.data);
        setStep("done");
        clearSale();
      } finally {
        setSubmitting(false);
        setConfirmInvoice(false);
      }
    },
    [saleSessionId, customer, readShippingAddress, shippingMethodId, clearSale]
  );

  async function handleApplyCode() {
    setDiscountError(null);
    const code = discountEntry.trim();
    if (!code) return;
    const r = await applyCode(code);
    if (!r.success) setDiscountError(r.error ?? "Invalid code");
    else setDiscountEntry("");
  }

  function resetForNewSale() {
    setResult(null);
    setMode(null);
    setShippingMethodId(undefined);
    setStep("customer");
    setError(null);
    startSale();
  }

  /* ---- Confirmation screen ---------------------------------------- */
  if (step === "done" && result) {
    const emailedTo = result.payment_link_email_sent ? (customer?.email ?? null) : null;
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-12">
        <div
          className="flex size-14 items-center justify-center rounded-full text-2xl text-white"
          style={{ background: NAVY }}
        >
          ✓
        </div>
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Order placed
          </p>
          <h1 className="font-serif text-4xl text-[#0a1a2e]">
            {result.order_number ? `Order ${result.order_number}` : "Order received"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {fmtCurrency(result.total)} ·{" "}
            {result.payment_status === "success"
              ? "Paid — receipt emailed to the customer."
              : result.payment_link_url
                ? "Awaiting payment via link."
                : "Unpaid — will be settled offline."}
          </p>
        </div>

        {result.payment_link_url && (
          <PayLinkResult
            url={result.payment_link_url}
            emailSentTo={emailedTo}
            onResend={async () => (await resendPaymentLink(result.id)).ok}
          />
        )}

        <div className="flex w-full max-w-sm flex-col gap-2">
          <Button
            className="h-16 text-lg"
            style={{ background: GOLD, color: NAVY }}
            onClick={resetForNewSale}
          >
            New Sale
          </Button>
          <Button variant="outline" className="h-12" render={<Link href="/rep/orders" />}>
            View orders
          </Button>
        </div>
      </div>
    );
  }

  /* ---- Main flow ---------------------------------------------------- */
  const stepIndex = ["customer", "cart", "shipping", "payment"].indexOf(step);

  return (
    <div className="mx-auto flex max-w-7xl gap-4 px-4 py-4 sm:px-6">
      <div className="min-w-0 flex-1">
        {/* Step header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-x-auto">
            {(Object.keys(STEP_TITLES) as Array<Exclude<SaleStep, "done">>).map(
              (s, i) => (
                <button
                  key={s}
                  type="button"
                  disabled={i > stepIndex}
                  onClick={() => setStep(s)}
                  className={`flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium transition-opacity disabled:opacity-40 ${
                    step === s ? "text-[#0a1a2e]" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs ${
                      step === s ? "text-white" : "bg-muted text-muted-foreground"
                    }`}
                    style={step === s ? { background: NAVY } : undefined}
                  >
                    {i + 1}
                  </span>
                  {STEP_TITLES[s]}
                </button>
              )
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              clearSale();
              resetForNewSale();
            }}
            className="h-10 shrink-0 rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel sale
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Step 1 — customer */}
        <section className={step === "customer" ? "flex flex-col gap-4" : "hidden"}>
          <CustomerSearch onSelect={handleSelectCustomer} autoFocus />
          <div className="flex justify-center">
            <CustomerCreateDialog onCreated={handleSelectCustomer} />
          </div>
        </section>

        {/* Step 2 — build cart */}
        <section className={step === "cart" ? "flex flex-col gap-4" : "hidden"}>
          {products === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </div>
          ) : (
            <ProductPad
              products={products}
              cart={cart}
              cartBusy={cartBusy}
              onAdd={(productId) => addItem(productId, 1)}
              onSetQuantity={(itemId, q) =>
                q <= 0 ? removeItem(itemId) : updateItem(itemId, q)
              }
            />
          )}
          <div className="sticky bottom-0 -mx-4 border-t border-border bg-white/95 p-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
            <Button
              className="h-14 w-full text-base"
              disabled={!cart || cart.items.length === 0}
              onClick={() => setStep("shipping")}
            >
              Continue to shipping
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        </section>

        {/* Step 3 — shipping (form stays mounted so FormData persists) */}
        <form
          ref={formRef}
          className={step === "shipping" ? "flex flex-col gap-5" : "hidden"}
          onSubmit={(e) => {
            e.preventDefault();
            goToPayment();
          }}
        >
          <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
            <h2 className="mb-3 font-serif text-xl text-[#0a1a2e]">Ship to</h2>
            <AddressFields
              idPrefix="rep-ship-"
              section="shipping"
              errors={addressErrors}
              showErrors={showErrors}
              onValidityRecheck={() => {
                if (showErrors) setAddressErrors(validateSaleAddress(readShippingAddress()));
              }}
            />
          </div>

          {shippingOptions.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
              <h2 className="mb-3 font-serif text-xl text-[#0a1a2e]">Shipping method</h2>
              <div className="grid gap-2">
                {shippingOptions.map((option) => (
                  <button
                    key={option.method_id}
                    type="button"
                    onClick={() => setShippingMethodId(option.method_id)}
                    className={`flex min-h-14 items-center justify-between rounded-lg border px-4 text-left transition-colors ${
                      shippingMethodId === option.method_id
                        ? "border-[#0a1a2e] bg-[#0a1a2e]/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-medium">{option.method_name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {option.price === 0 ? "Free" : fmtCurrency(option.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
            <h2 className="mb-3 font-serif text-xl text-[#0a1a2e]">Discount code</h2>
            <div className="flex gap-2">
              <Input
                value={discountEntry}
                onChange={(e) => setDiscountEntry(e.target.value)}
                placeholder="Code"
                className="h-12"
              />
              <Button
                type="button"
                variant="outline"
                className="h-12 px-5"
                onClick={handleApplyCode}
                disabled={!discountEntry.trim()}
              >
                Apply
              </Button>
            </div>
            {discountError && (
              <p className="mt-2 text-sm text-destructive">{discountError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-14 px-5"
              onClick={() => setStep("cart")}
            >
              <ArrowLeft className="mr-2 size-5" />
              Back
            </Button>
            <Button type="submit" className="h-14 flex-1 text-base">
              Continue to payment
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        </form>

        {/* Step 4 — payment (kept mounted once reached so Accept.js survives) */}
        <section className={step === "payment" ? "flex flex-col gap-5" : "hidden"}>
          <PaymentModeCards
            value={mode}
            onChange={setMode}
            disabled={submitting}
            linkAvailable={modes.link}
          />
          {!modes.card && mode === "card" && (
            <p className="text-sm text-muted-foreground">
              On-page card entry is not enabled for this store.
            </p>
          )}

          <div className={mode === "card" && modes.card ? "" : "hidden"}>
            <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
              <PaymentSection
                ref={paymentRef}
                config={paymentConfig}
                storedMethods={[]}
                isAuthenticated={false}
                visible={step === "payment" && mode === "card"}
              />
            </div>
          </div>

          <label className="flex min-h-11 items-start gap-2.5 rounded-lg border border-border bg-white px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-5 accent-[#0a1a2e]"
              checked={disclaimersConfirmed}
              onChange={(e) => setDisclaimersConfirmed(e.target.checked)}
            />
            <span>
              The customer has confirmed the store&apos;s required disclaimers in
              person (age verification where applicable).
            </span>
          </label>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-14 px-5"
              onClick={() => setStep("shipping")}
              disabled={submitting}
            >
              <ArrowLeft className="mr-2 size-5" />
              Back
            </Button>
            <Button
              type="button"
              className="h-14 flex-1 text-base"
              style={{ background: GOLD, color: NAVY }}
              disabled={!mode || submitting || (mode === "card" && !modes.card)}
              onClick={() => {
                if (mode === "invoice") setConfirmInvoice(true);
                else if (mode) placeOrder(mode);
              }}
            >
              {submitting
                ? "Placing order…"
                : mode === "card"
                  ? `Charge ${cart ? fmtCurrency(cart.total) : ""}`
                  : mode === "link"
                    ? "Create order & send link"
                    : mode === "invoice"
                      ? "Place unpaid order"
                      : "Select a payment method"}
            </Button>
          </div>
        </section>
      </div>

      {/* Right rail — running order */}
      <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-[360px] shrink-0 lg:block">
        <SaleCartRail
          customer={customer}
          cart={cart}
          cartBusy={cartBusy}
          shippingLabel={
            shippingMethodId
              ? (() => {
                  const opt = shippingOptions.find((o) => o.method_id === shippingMethodId);
                  return opt ? (opt.price === 0 ? "Free" : fmtCurrency(opt.price)) : null;
                })()
              : null
          }
          onSetQuantity={(itemId, q) => (q <= 0 ? removeItem(itemId) : updateItem(itemId, q))}
          onRemove={removeItem}
          onChangeCustomer={() => setStep("customer")}
        />
      </aside>

      {/* Invoice confirmation */}
      <Dialog open={confirmInvoice} onOpenChange={setConfirmInvoice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place unpaid order?</DialogTitle>
            <DialogDescription>
              {customer && cart
                ? `${fmtCurrency(cart.total)} order for ${customer.name || customer.email} will be placed as pending payment and settled offline.`
                : "This order will be placed as pending payment."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setConfirmInvoice(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="h-11"
              onClick={() => placeOrder("invoice")}
              disabled={submitting}
            >
              {submitting ? "Placing…" : "Place order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

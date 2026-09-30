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
import { CustomerChip, CustomerStep } from "@/components/rep/customer-picker";
import { ProductPad } from "@/components/rep/product-pad";
import { SaleCartRail } from "@/components/rep/sale-cart-rail";
import { SaleOrderBar } from "@/components/rep/sale-order-bar";
import { PaymentModeCards, type PaymentMode } from "@/components/rep/payment-mode-cards";
import { PayLinkResult } from "@/components/rep/pay-link-result";
import { fmtCurrency } from "@/components/rep/format";
import {
  availableModes,
  saleAddressFromShipTo,
  buildShipTo,
  initialSaleStep,
  paymentModeAvailability,
  soleAvailableMode,
  validateSaleAddress,
  SALE_STEPS,
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
import { ArrowLeft, ArrowRight, X } from "lucide-react";

const GOLD = "#d4a951";
const NAVY = "#0a1a2e";

const STEP_TITLES: Record<Exclude<SaleStep, "done">, string> = {
  customer: "Customer",
  build: "Build order",
  checkout: "Checkout",
};

export default function NewSalePage() {
  const sale = useRepSale();
  const {
    saleSessionId,
    hydrated,
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

  // Arriving from Customers the provider already holds the customer; after a
  // refresh it only knows once hydrated, so re-derive the step at that moment
  // (render-time adjustment, like soleMode below).
  const [step, setStep] = useState<SaleStep>(() => initialSaleStep(customer !== null));
  const [prevHydrated, setPrevHydrated] = useState(hydrated);
  if (hydrated !== prevHydrated) {
    setPrevHydrated(hydrated);
    if (hydrated && step === "customer") setStep(initialSaleStep(customer !== null));
  }
  const [selectingCustomer, setSelectingCustomer] = useState(false);
  const [products, setProducts] = useState<StorefrontProduct[] | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentClientConfig | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState<string | undefined>();
  const [mode, setMode] = useState<PaymentMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [addressErrors, setAddressErrors] = useState<Record<string, string | undefined>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmInvoice, setConfirmInvoice] = useState(false);
  const [disclaimersConfirmed, setDisclaimersConfirmed] = useState(false);
  const [result, setResult] = useState<RepCheckoutResponse | null>(null);
  const [discountEntry, setDiscountEntry] = useState("");

  // Every cart mutation throws — requireSession() when the sale has gone away,
  // StadianError for stock and session failures — and each call site below is a
  // tap on a POS button. Unhandled, the rejection is swallowed: the rep taps Add
  // and simply watches nothing happen. Route failures to the same error banner
  // the rest of the flow already uses.
  const runCartAction = useCallback(async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the sale");
    }
  }, []);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const paymentRef = useRef<PaymentSectionHandle>(null);

  // A sale needs a session before anything else happens — but only once the
  // provider has read sessionStorage back. Minting on mount would clobber a
  // sale still being restored (child effects run before parent ones), which is
  // how a mid-sale refresh used to lose the customer and the whole cart.
  useEffect(() => {
    if (hydrated && !saleSessionId && !result) startSale();
  }, [hydrated, saleSessionId, result, startSale]);

  useEffect(() => {
    getPaymentConfig().then(setPaymentConfig);
  }, []);

  // Refetch the catalog whenever the attached customer changes — the grid must
  // show the price the cart will charge, not the rep's own tier.
  useEffect(() => {
    let cancelled = false;
    getRepProducts(customer?.id).then((r) => {
      if (cancelled) return;
      setCatalogError(r.ok ? null : r.message);
      setProducts(r.ok ? r.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [customer?.id, catalogAttempt]);

  // Shipping options depend on the cart's contents.
  useEffect(() => {
    if (step !== "checkout" || !saleSessionId) return;
    getShippingOptions(saleSessionId).then((options) => {
      setShippingOptions(options);
      setShippingMethodId((current) => current ?? options[0]?.method_id);
    });
  }, [step, saleSessionId, cart?.items.length]);

  const modes = useMemo(() => availableModes(paymentConfig), [paymentConfig]);
  const modeAvailability = useMemo(
    () => paymentModeAvailability(modes, paymentConfig === null),
    [modes, paymentConfig]
  );

  // A store with no gateway can only invoice. Preselect it rather than making
  // the rep tap the one tile that was ever going to work. Render-time state
  // adjustment, not a setState-in-effect (which cascades renders).
  const soleMode = paymentConfig === null ? null : soleAvailableMode(modeAvailability);
  const [prevSoleMode, setPrevSoleMode] = useState<PaymentMode | null>(null);
  if (soleMode !== prevSoleMode) {
    setPrevSoleMode(soleMode);
    if (soleMode && mode === null) setMode(soleMode);
  }

  const shippingLabel = useMemo(() => {
    if (!shippingMethodId) return null;
    const option = shippingOptions.find((o) => o.method_id === shippingMethodId);
    if (!option) return null;
    return option.price === 0 ? "Free" : fmtCurrency(option.price);
  }, [shippingMethodId, shippingOptions]);

  const handleSelectCustomer = useCallback(
    async (next: RepCustomer) => {
      setError(null);
      setSelectingCustomer(true);
      try {
        // Fetch the detail (includes last ship-to for prefill).
        const detail = await getRepCustomer(next.id);
        await selectCustomer(detail.ok ? detail.data : next);
        setDisclaimersConfirmed(false);
        setAddressErrors({});
        setShowErrors(false);
        setStep("build");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not select customer");
      } finally {
        setSelectingCustomer(false);
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

  const placeOrder = useCallback(
    async (chosenMode: PaymentMode) => {
      if (!saleSessionId || !customer) return;
      if (!disclaimersConfirmed) {
        setError("Confirm the customer's required disclaimers before placing the order.");
        return;
      }
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
    [saleSessionId, customer, readShippingAddress, shippingMethodId, clearSale, disclaimersConfirmed]
  );

  // Shipping and payment share one screen, so the address is validated at the
  // moment of sale rather than at a step boundary. Errors surface in place —
  // the rep never leaves the screen to fix a ZIP.
  const submitSale = useCallback(() => {
    const errors = validateSaleAddress(readShippingAddress());
    setAddressErrors(errors);
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (!mode) return;
    if (mode === "invoice") setConfirmInvoice(true);
    else placeOrder(mode);
  }, [readShippingAddress, mode, placeOrder]);

  async function handleApplyCode() {
    setDiscountError(null);
    const code = discountEntry.trim();
    if (!code) return;
    const r = await applyCode(code);
    if (!r.success) setDiscountError(r.error ?? "Invalid code");
    else setDiscountEntry("");
  }

  function resetForNewSale() {
    setDisclaimersConfirmed(false);
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
  const stepIndex = SALE_STEPS.indexOf(step);

  return (
    <div className="mx-auto flex h-full w-full min-h-0 max-w-7xl gap-4 overflow-hidden px-4 py-4 sm:px-6">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Step header */}
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto sm:gap-3">
            {(Object.keys(STEP_TITLES) as Array<Exclude<SaleStep, "done">>).map(
              (s, i) => (
                <button
                  key={s}
                  type="button"
                  disabled={i > stepIndex}
                  onClick={() => setStep(s)}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 text-[13px] font-medium transition-opacity disabled:opacity-40 sm:gap-2 sm:text-sm ${
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
            aria-label="Cancel sale"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-xs font-medium text-muted-foreground hover:bg-muted sm:size-auto sm:h-10 sm:px-3"
          >
            <X className="size-5 sm:hidden" aria-hidden />
            <span className="hidden sm:inline">Cancel sale</span>
          </button>
        </div>

        {/* Who the sale is for, once chosen. On wide screens the rail header
            carries it; on narrow ones this chip is the only place it appears
            above the order bar. */}
        {step !== "customer" && (
          <div className="mb-4 flex shrink-0 lg:hidden">
            <CustomerChip customer={customer} onOpen={() => setStep("customer")} />
          </div>
        )}

        {error && (
          <p className="mb-4 shrink-0 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Step 1 — who the sale is for. Everything after depends on it: the
            catalog prices at their tier and checkout ships to them. */}
        {step === "customer" && (
          <CustomerStep
            customer={customer}
            selecting={selectingCustomer}
            onSelect={handleSelectCustomer}
            onKeep={() => setStep("build")}
          />
        )}

        {/* Step 2 — build the order */}
        <section
          className={step === "build" ? "flex min-h-0 flex-1 flex-col" : "hidden"}
        >
          <div className="min-h-0 flex-1">
            {catalogError ? (
              <div role="alert" className="rounded-lg border p-4">
                <p>{catalogError}</p>
                <Button type="button" variant="outline" className="mt-3" onClick={() => { setCatalogError(null); setProducts(null); setCatalogAttempt((n) => n + 1); }}>Retry catalog</Button>
              </div>
            ) : products === null ? (
              <div className="grid h-full auto-rows-max grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-56" />
                ))}
              </div>
            ) : (
            <ProductPad
              products={products}
              cart={cart}
              cartBusy={cartBusy}
              onAdd={(productId) => runCartAction(() => addItem(productId, products?.find((p) => p.id === productId)?.min_order_quantity ?? 1))}
              onSetQuantity={(itemId, q) =>
                runCartAction(() =>
                  q <= 0 ? removeItem(itemId) : updateItem(itemId, q)
                )
              }
            />
            )}
          </div>
          <div className="mt-3 shrink-0 rounded-xl border border-border bg-white p-3">
            {/* Purely the step advance. The customer step guarantees a
                customer; the guard stays for a sale restored without one. */}
            <Button
              className="h-14 w-full text-base"
              disabled={!customer || !cart || cart.items.length === 0}
              onClick={() => setStep("checkout")}
            >
              Continue to checkout
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        </section>

        {/* Step 3 — checkout: shipping AND payment on one screen. Kept mounted
            so FormData persists and Accept.js survives step changes. */}
        <form
          ref={formRef}
          className={step === "checkout" ? "flex min-h-0 flex-1 flex-col" : "hidden"}
          onSubmit={(e) => {
            e.preventDefault();
            submitSale();
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
            <h2 className="mb-3 font-serif text-xl text-[#0a1a2e]">Ship to</h2>
            <AddressFields
              key={`${saleSessionId}:${customer?.id ?? "none"}`}
              defaultValues={saleAddressFromShipTo(customer?.last_ship_to)}
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
          <PaymentModeCards
            value={mode}
            onChange={setMode}
            disabled={submitting}
            availability={modeAvailability}
          />

          <div className={mode === "card" && modes.card ? "" : "hidden"}>
            <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
              <PaymentSection
                ref={paymentRef}
                config={paymentConfig}
                storedMethods={[]}
                // The POS only mounts this in card mode (gateway enabled), so the
                // offline picker never renders here. Reps take offline payment
                // through the Invoice mode tile instead.
                manualMethods={[]}
                isAuthenticated={false}
                visible={step === "checkout" && mode === "card"}
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
          </div>

          <div className="mt-4 flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-14 px-5"
              onClick={() => setStep("build")}
              disabled={submitting}
            >
              <ArrowLeft className="mr-2 size-5" />
              Back
            </Button>
            <Button
              type="button"
              className="h-14 flex-1 text-base"
              style={{ background: GOLD, color: NAVY }}
              disabled={!mode || submitting || !disclaimersConfirmed || (mode === "card" && !modes.card)}
              onClick={submitSale}
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
        </form>

        {/* Below lg there is no room for the rail, and a POS that hides the
            total has failed its one job. This bar keeps line count, customer
            and total on the bottom edge — in the thumb zone — and expands to
            the full order on tap. */}
        <div className={step === "customer" ? "hidden" : "mt-3 shrink-0 lg:hidden"}>
          <SaleOrderBar
            customer={customer}
            cart={cart}
            cartBusy={cartBusy}
            shippingLabel={shippingLabel}
            onSetQuantity={(itemId, q) =>
              runCartAction(() =>
                q <= 0 ? removeItem(itemId) : updateItem(itemId, q)
              )
            }
            onRemove={(itemId) => runCartAction(() => removeItem(itemId))}
            onChangeCustomer={() => setStep("customer")}
          />
        </div>
      </div>

      {/* Right rail — running order (wide screens only; below lg the pinned
          SaleOrderBar carries the same information). Hidden while choosing the
          customer so the picker is the only thing on screen. */}
      <aside
        className={
          step === "customer" ? "hidden" : "hidden h-full w-[360px] shrink-0 lg:block"
        }
      >
        <SaleCartRail
          customer={customer}
          cart={cart}
          cartBusy={cartBusy}
          shippingLabel={shippingLabel}
          onSetQuantity={(itemId, q) =>
            runCartAction(() => (q <= 0 ? removeItem(itemId) : updateItem(itemId, q)))
          }
          onRemove={(itemId) => runCartAction(() => removeItem(itemId))}
          onRestore={(productId, quantity) =>
            runCartAction(() => addItem(productId, quantity))
          }
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

"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/cart-provider";
import { useAuth } from "@/providers/auth-provider";
import { OrderSummary } from "@/components/cart/order-summary";
import { createOrder } from "@/app/actions/checkout";
import {
  getManualPaymentMethods,
  getPaymentConfig,
  getStoredPaymentMethods,
  type ManualPaymentMethod,
  type PaymentClientConfig,
  type StoredPaymentMethod,
} from "@/app/actions/payments";
import {
  PaymentSection,
  type PaymentSectionHandle,
} from "@/components/checkout/payment-section";
import { getSessionId, clearSession } from "@/lib/session";
import { getShippingOptions } from "@/app/actions/shipping";
import { getCheckoutFlow } from "@/app/actions/checkout-flow";
import type {
  CheckoutFlowResponse,
  ShippingOption,
  StorefrontTrustSignal,
} from "@stadian/storefront-sdk";
import { getTrustSignals } from "@/app/actions/branding";
import { CheckoutTrustRow } from "@/components/checkout/checkout-trust-row";
import { ShippingMethods } from "@/components/checkout/shipping-methods";
import { CheckoutFlowSteps } from "@/components/checkout/checkout-flow-steps";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressFields } from "@/components/checkout/address-fields";
import { buildOrderPayload, resolveCheckoutResult, formatCheckoutError } from "@/app/checkout/checkout-logic";
import { formatCurrency } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { OrderConfirmation, type ConfirmedOrder } from "@/components/checkout/order-confirmation";
import { validateCheckout, isCheckoutFilled } from "@/app/checkout/checkout-validation";

/** Numbered step indicator: filled=green check, active=primary, upcoming=muted. */
function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        done
          ? "bg-green-600 text-white"
          : active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {done ? "✓" : n}
    </span>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading } = useCart();
  const { isAuthenticated } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [lastEmail, setLastEmail] = useState("");
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string | undefined>(undefined);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [trustSignals, setTrustSignals] = useState<StorefrontTrustSignal[]>([]);
  // Progressive-disclosure step: 1 = Contact, 2 = Shipping, 3 = Payment.
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [summaries, setSummaries] = useState<{ contact?: string; shipping?: string }>({});

  const [paymentConfig, setPaymentConfig] = useState<PaymentClientConfig | null>(null);
  const [manualMethods, setManualMethods] = useState<ManualPaymentMethod[]>([]);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [storedMethods, setStoredMethods] = useState<StoredPaymentMethod[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [checkoutFlow, setCheckoutFlow] = useState<CheckoutFlowResponse | null>(null);

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formFilled, setFormFilled] = useState(false);

  const paymentRef = useRef<PaymentSectionHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Ref so recompute doesn't capture stale submitAttempted in closure
  const submitAttemptedRef = useRef(false);

  const getValues = useCallback(() => {
    if (!formRef.current) return null;
    const data = new FormData(formRef.current);
    const { sameAsShipping, billingAddress } =
      paymentRef.current?.getBillingState() ?? { sameAsShipping: true, billingAddress: undefined };

    return {
      fullName: (data.get("full_name") as string) ?? "",
      email: (data.get("email") as string) ?? "",
      shipping: {
        line1: (data.get("line1") as string) ?? "",
        city: (data.get("city") as string) ?? "",
        state: (data.get("state") as string) ?? "",
        zip: (data.get("zip") as string) ?? "",
        country: (data.get("country") as string) ?? "",
      },
      sameAsShipping,
      billing: billingAddress
        ? {
            line1: billingAddress.line1 ?? "",
            city: billingAddress.city ?? "",
            state: billingAddress.state ?? "",
            zip: billingAddress.zip ?? "",
            country: billingAddress.country ?? "",
          }
        : sameAsShipping
          ? undefined
          : { line1: "", city: "", state: "", zip: "", country: "" },
    };
  }, []);

  const recompute = useCallback(() => {
    const values = getValues();
    if (!values) return;

    setFormFilled(isCheckoutFilled(values));

    // Only re-run format validation after a submit attempt (to clear errors as user fixes them)
    if (submitAttemptedRef.current) {
      setFieldErrors(validateCheckout(values));
    }
  }, [getValues]);

  function handleShippingStateChange(state: string) {
    if (!state) return;
    const sessionId = getSessionId();
    getCheckoutFlow(sessionId, state).then((flow) => {
      setCheckoutFlow(flow);
    });
    recompute();
  }

  useEffect(() => {
    if (!loading && (!cart || cart.items.length === 0)) {
      router.push("/cart");
    }
  }, [loading, cart, router]);

  // Learn the compliance requirements up front, not at submit. The age
  // disclaimer is the one that matters: the guard rejects the order without it,
  // so the buyer needs a way to confirm BEFORE they press Place Order.
  useEffect(() => {
    let cancelled = false;
    const sessionId = getSessionId();
    if (!sessionId) return;
    getCheckoutFlow(sessionId, "").then((flow) => {
      if (!cancelled && flow) setCheckoutFlow(flow);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadPaymentData() {
      try {
        const [config, methods, manual] = await Promise.all([
          getPaymentConfig(),
          isAuthenticated ? getStoredPaymentMethods() : Promise.resolve([]),
          getManualPaymentMethods(),
        ]);
        if (cancelled) return;
        setPaymentConfig(config);
        setStoredMethods(methods);
        setManualMethods(manual);
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    }
    loadPaymentData();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (loading || !cart || cart.items.length === 0) return;
    let cancelled = false;
    async function loadShipping() {
      const sessionId = getSessionId();
      const options = await getShippingOptions(sessionId);
      if (!cancelled) setShippingOptions(options);
    }
    loadShipping();
    return () => {
      cancelled = true;
    };
  }, [loading, cart]);

  // Tenant-configured trust signals for the checkout trust row.
  useEffect(() => {
    let cancelled = false;
    getTrustSignals()
      .then((signals) => {
        if (!cancelled) setTrustSignals(signals);
      })
      .catch(() => {
        /* non-critical — the row just stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function continueFromContact() {
    const values = getValues();
    if (!values) return;
    const errs = validateCheckout(values);
    if (errs.full_name || errs.email) {
      setFieldErrors(errs);
      setSubmitAttempted(true);
      return;
    }
    setSummaries((s) => ({ ...s, contact: `${values.fullName} · ${values.email}` }));
    setSubmitAttempted(false);
    setStep(2);
  }

  function continueFromShipping() {
    const values = getValues();
    if (!values) return;
    const errs = validateCheckout(values);
    if (errs.line1 || errs.city || errs.state || errs.zip || errs.country) {
      setFieldErrors(errs);
      setSubmitAttempted(true);
      return;
    }
    if (shippingOptions.length > 0 && !selectedShippingMethodId) {
      setError("Please choose a shipping method.");
      return;
    }
    const s = values.shipping;
    setSummaries((prev) => ({
      ...prev,
      shipping: `${s.line1}, ${s.city}, ${s.state} ${s.zip}`,
    }));
    setError(null);
    setSubmitAttempted(false);
    setStep(3);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Only the final step places the order (guards Enter-key submits on earlier steps).
    if (step !== 3) return;

    const values = getValues();
    if (!values) return;

    const errs = validateCheckout(values);
    if (Object.keys(errs).length > 0) {
      submitAttemptedRef.current = true;
      setSubmitAttempted(true);
      setFieldErrors(errs);
      // Focus the first invalid field
      const firstKey = Object.keys(errs)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }

    // An offline store must know HOW the buyer intends to pay — that choice is
    // what triggers the payment-instruction email. Checked synchronously: any
    // await here would detach the form event before FormData is built below.
    if (needsAgeConfirmation && !ageConfirmed) {
      submitAttemptedRef.current = true;
      setSubmitAttempted(true);
      setError("Please confirm you meet the minimum age requirement.");
      return;
    }

    if (
      !paymentConfig?.gateway_enabled &&
      manualMethods.length > 0 &&
      !paymentRef.current?.getManualSelection()
    ) {
      submitAttemptedRef.current = true;
      setSubmitAttempted(true);
      setError("Please choose how you'd like to pay.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const paymentData = paymentRef.current
        ? await paymentRef.current.getPaymentData()
        : {};

      const { sameAsShipping, billingAddress } =
        paymentRef.current?.getBillingState() ?? { sameAsShipping: true, billingAddress: undefined };

      // Split the single "Full name" field into first/last so the backend can
      // build the gateway's AVS billTo and the shipping label.
      const fullName = ((data.get("full_name") as string) || "").trim();
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");

      const shipping = {
        first_name: firstName,
        last_name: lastName,
        line1: data.get("line1") as string,
        line2: (data.get("line2") as string) || undefined,
        city: data.get("city") as string,
        state: data.get("state") as string,
        zip: data.get("zip") as string,
        country: data.get("country") as string,
      };

      const email = data.get("email") as string;
      const payload = buildOrderPayload({
        email,
        shipping,
        sameAsShipping,
        billing: billingAddress,
        shippingMethodId: selectedShippingMethodId,
        customerToken: undefined, // resolved in Task 10
        notes: (data.get("notes") as string) || undefined,
        paymentData,
        // Recorded server-side before the compliance guard runs, so the buyer
        // satisfies the age requirement in the same action that places the order.
        ageVerificationAccepted: needsAgeConfirmation && ageConfirmed,
      });

      const sessionId = getSessionId();
      const createResult = await createOrder(sessionId, payload);

      if (!createResult.ok) {
        setError(formatCheckoutError(createResult));
        setSubmitting(false);
        return;
      }

      const order = createResult.order;
      const result = resolveCheckoutResult(order, paymentData.paymentFlow);

      if (result.kind === "failed") {
        setError(result.message);
        setSubmitting(false);
        return;
      }

      clearSession();

      if (result.kind === "redirect") {
        // assign() rather than href = : same navigation, but the lint rule
        // reads a bare href assignment as mutating a value it protects.
        window.location.assign(result.url);
        return;
      }

      // result.kind === "success"
      if (isAuthenticated) {
        router.push(`/account/orders/${result.orderId}`);
        return;
      }

      // Guest: show inline confirmation
      setLastEmail(email);
      setConfirmedOrder(order);
    } catch (err) {
      // createOrder returns expected API errors as data; this only catches
      // unexpected throws (e.g. payment tokenization before the request).
      setError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
      setSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return (
      <OrderConfirmation
        order={confirmedOrder}
        email={lastEmail}
        manualMethod={manualMethods.find(
          (m) => m.key === confirmedOrder.payment_method,
        )}
      />
    );
  }

  if (loading || !cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // The age disclaimer is the one requirement the buyer can satisfy right here,
  // by ticking the box below — so it must not count as a blocker the way an
  // unverified identity or a restricted shipping state does.
  const ageStep = checkoutFlow?.steps.find(
    (s) => s.step === "disclaimer" && s.type === "age_verification",
  );
  const needsAgeConfirmation = !!ageStep && !ageStep.completed;

  const hasUnresolvableBlocker =
    checkoutFlow != null &&
    (checkoutFlow.blocked_products.length > 0 ||
      checkoutFlow.steps.some(
        (s) =>
          s.required &&
          !s.completed &&
          s.step !== "payment" &&
          !(s.step === "disclaimer" && s.type === "age_verification"),
      ));

  const placeOrderDisabled =
    submitting ||
    configLoading ||
    !formFilled ||
    hasUnresolvableBlocker ||
    (needsAgeConfirmation && !ageConfirmed);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Checkout</h1>
      <CheckoutTrustRow signals={trustSignals} />
      <form
        ref={formRef}
        noValidate
        onSubmit={handleSubmit}
        onInput={recompute}
        onChange={recompute}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            {/* Step 1 — Contact. Inputs stay mounted (hidden when inactive) so
                FormData reads them at final submit. */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2.5">
                  <StepBadge n={1} active={step === 1} done={step > 1} />
                  Contact
                </CardTitle>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Edit
                  </button>
                )}
              </CardHeader>
              {step > 1 && summaries.contact && (
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {summaries.contact}
                </CardContent>
              )}
              <CardContent
                className={`flex flex-col gap-4 ${step === 1 ? "" : "hidden"}`}
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                    aria-invalid={submitAttempted && !!fieldErrors.full_name}
                  />
                  {submitAttempted && fieldErrors.full_name && (
                    <p className="mt-1 text-sm text-destructive">{fieldErrors.full_name}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    aria-invalid={submitAttempted && !!fieldErrors.email}
                  />
                  {submitAttempted && fieldErrors.email && (
                    <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
                  )}
                </div>
                <Button type="button" className="mt-1 self-start" onClick={continueFromContact}>
                  Continue to shipping
                </Button>
              </CardContent>
            </Card>

            {/* Step 2 — Shipping (address + method) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2.5">
                  <StepBadge n={2} active={step === 2} done={step > 2} />
                  Shipping
                </CardTitle>
                {step > 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Edit
                  </button>
                )}
              </CardHeader>
              {step > 2 && summaries.shipping && (
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {summaries.shipping}
                </CardContent>
              )}
              <CardContent
                className={`flex flex-col gap-6 ${step === 2 ? "" : "hidden"}`}
              >
                <AddressFields
                  section="shipping"
                  onStateChange={handleShippingStateChange}
                  errors={fieldErrors}
                  onValidityRecheck={recompute}
                  showErrors={submitAttempted}
                />
                {shippingOptions.length > 0 && (
                  <div>
                    <p className="mb-3 text-sm font-medium">Shipping method</p>
                    <ShippingMethods
                      options={shippingOptions}
                      value={selectedShippingMethodId}
                      onChange={setSelectedShippingMethodId}
                    />
                  </div>
                )}
                <Button type="button" className="self-start" onClick={continueFromShipping}>
                  Continue to payment
                </Button>
              </CardContent>
            </Card>

            {/* Step 3 — Payment (+ compliance, billing, notes). PaymentSection
                stays mounted throughout so Accept.js never tears down. */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2.5">
                  <StepBadge n={3} active={step === 3} done={false} />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent
                className={`flex flex-col gap-6 ${step === 3 ? "" : "hidden"}`}
              >
                <CheckoutFlowSteps flow={checkoutFlow} />
                {configLoading ? (
                  <p className="text-sm text-muted-foreground">Loading payment options...</p>
                ) : (
                  <PaymentSection
                    ref={paymentRef}
                    config={paymentConfig}
                    manualMethods={manualMethods}
                    onManualMethodChange={() => setError(null)}
                    storedMethods={storedMethods}
                    isAuthenticated={isAuthenticated}
                    billingErrors={fieldErrors}
                    onValidityRecheck={recompute}
                    showErrors={submitAttempted}
                    visible={step === 3}
                  />
                )}

                {/* Age confirmation. The compliance guard requires a recorded
                    acceptance for age-restricted products and will reject the
                    order without one, so it has to be collectable here — a
                    first-time buyer has no other way to give it. */}
                {needsAgeConfirmation && (
                  <div
                    className={`rounded-lg border p-4 ${
                      submitAttempted && !ageConfirmed
                        ? "border-destructive bg-destructive/5"
                        : "border-border bg-muted/40"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={ageConfirmed}
                        onChange={(e) => {
                          setAgeConfirmed(e.target.checked);
                          if (e.target.checked) setError(null);
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                      />
                      <span className="text-sm">
                        {ageStep?.description ??
                          "I confirm I meet the minimum age requirement for these products."}
                      </span>
                    </label>
                    {submitAttempted && !ageConfirmed && (
                      <p className="mt-2 pl-7 text-sm text-destructive">
                        Please confirm this to place your order.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">
                    Order notes{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea id="notes" name="notes" placeholder="Any special instructions or questions..." rows={3} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <OrderSummary
              cart={cart}
              shippingCost={
                shippingOptions.find(
                  (o) => o.method_id === selectedShippingMethodId,
                )?.price
              }
            />

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {/* Desktop place-order — only at the final step (earlier steps use
                the in-step "Continue" buttons). */}
            {step === 3 && (
              <>
                <Button
                  type="submit"
                  size="lg"
                  className="hidden w-full lg:inline-flex"
                  disabled={placeOrderDisabled}
                >
                  {submitting ? "Placing order..." : "Place Order"}
                </Button>

                <p className="hidden items-center justify-center gap-1.5 text-center text-xs text-muted-foreground lg:flex">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {paymentConfig?.gateway_enabled
                    ? "Secure checkout — your card is encrypted and never stored on our servers."
                    : "Secure checkout — no card details are collected on this order."}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Mobile sticky place-order bar (final step only) */}
        {step === 3 && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-base font-semibold tabular-nums">
                  {formatCurrency(cart.total)}
                </span>
              </div>
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={placeOrderDisabled}
              >
                {submitting ? "Placing order..." : "Place Order"}
              </Button>
            </div>
          </div>
        )}
        {/* Spacer so the sticky bar doesn't cover the last card on mobile */}
        {step === 3 && <div className="h-24 lg:hidden" />}
      </form>
    </div>
  );
}

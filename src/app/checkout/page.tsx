"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/cart-provider";
import { useAuth } from "@/providers/auth-provider";
import { OrderSummary } from "@/components/cart/order-summary";
import { createOrder } from "@/app/actions/checkout";
import {
  getPaymentConfig,
  getStoredPaymentMethods,
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
import type { CheckoutFlowResponse, ShippingOption } from "@stadian/storefront-sdk";
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
import { buildOrderPayload, resolveCheckoutResult } from "@/app/checkout/checkout-logic";
import { OrderConfirmation, type ConfirmedOrder } from "@/components/checkout/order-confirmation";
import { validateCheckout, isCheckoutFilled } from "@/app/checkout/checkout-validation";

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

  const [paymentConfig, setPaymentConfig] = useState<PaymentClientConfig | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    async function loadPaymentData() {
      try {
        const [config, methods] = await Promise.all([
          getPaymentConfig(),
          isAuthenticated ? getStoredPaymentMethods() : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setPaymentConfig(config);
        setStoredMethods(methods);
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

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

      const shipping = {
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
      });

      const sessionId = getSessionId();
      const createResult = await createOrder(sessionId, payload);

      if (!createResult.ok) {
        setError(
          createResult.code === "INSUFFICIENT_STOCK"
            ? `${createResult.message}. Please update your cart before checking out.`
            : createResult.message || "Failed to place order. Please try again."
        );
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
        window.location.href = result.url;
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
    return <OrderConfirmation order={confirmedOrder} email={lastEmail} />;
  }

  if (loading || !cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Checkout</h1>
      <form
        ref={formRef}
        noValidate
        onSubmit={handleSubmit}
        onInput={recompute}
        onChange={recompute}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressFields
                  section="shipping"
                  onStateChange={handleShippingStateChange}
                  errors={fieldErrors}
                  onValidityRecheck={recompute}
                  showErrors={submitAttempted}
                />
              </CardContent>
            </Card>

            {shippingOptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <ShippingMethods
                    options={shippingOptions}
                    value={selectedShippingMethodId}
                    onChange={setSelectedShippingMethodId}
                  />
                </CardContent>
              </Card>
            )}

            <CheckoutFlowSteps flow={checkoutFlow} />

            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                {configLoading ? (
                  <p className="text-sm text-muted-foreground">Loading payment options...</p>
                ) : (
                  <PaymentSection
                    ref={paymentRef}
                    config={paymentConfig}
                    storedMethods={storedMethods}
                    isAuthenticated={isAuthenticated}
                    billingErrors={fieldErrors}
                    onValidityRecheck={recompute}
                    showErrors={submitAttempted}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Order Notes{" "}
                  <span className="text-sm font-normal text-muted-foreground">(optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notes for your order</Label>
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

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || configLoading || !formFilled || (checkoutFlow != null && !checkoutFlow.ready_to_checkout)}
            >
              {submitting ? "Placing order..." : "Place Order"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

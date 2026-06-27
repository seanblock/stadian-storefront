"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  PaymentClientConfig,
  StoredPaymentMethod,
} from "@/app/actions/payments";
import type { Address } from "@/app/checkout/checkout-logic";
import { StoredMethods } from "./stored-methods";
import { BillingAddress } from "./billing-address";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Public API exposed via ref                                        */
/* ------------------------------------------------------------------ */

export interface PaymentData {
  paymentToken?: string;
  paymentType?: "card" | "ach";
  paymentFlow?: "embedded" | "redirect";
  storedPaymentMethodId?: string;
  savePaymentMethod?: boolean;
}

export interface PaymentSectionHandle {
  getPaymentData: () => Promise<PaymentData>;
  getBillingState: () => { sameAsShipping: boolean; billingAddress?: Address };
}

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface PaymentSectionProps {
  config: PaymentClientConfig | null;
  storedMethods: StoredPaymentMethod[];
  isAuthenticated: boolean;
  billingErrors?: Record<string, string | undefined>;
  onValidityRecheck?: () => void;
  showErrors?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Minimal PaymentForm interface matching the SDK contract            */
/* ------------------------------------------------------------------ */

interface PaymentFormInstance {
  mount: (containers: {
    card?: string;
    ach?: string;
  }) => void;
  destroy: () => void;
  tokenize: () => Promise<{ token: string; type: "card" | "ach" }>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export const PaymentSection = forwardRef<
  PaymentSectionHandle,
  PaymentSectionProps
>(function PaymentSection({ config, storedMethods, isAuthenticated, billingErrors, onValidityRecheck, showErrors }, ref) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(
    storedMethods.find((m) => m.is_default)?.id ?? null,
  );
  const [paymentType, setPaymentType] = useState<"card" | "ach">("card");
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [saveCard, setSaveCard] = useState(false);
  const [formReady, setFormReady] = useState(false);

  const formRef = useRef<PaymentFormInstance | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const achContainerRef = useRef<HTMLDivElement>(null);

  /* ---- Load the gateway JS library and mount the form ------------ */
  useEffect(() => {
    if (!config?.gateway_enabled || config.checkout_mode !== "embedded") return;
    if (!config.js_library_url || !config.public_key) return;

    let destroyed = false;

    async function init() {
      // Dynamically load the gateway JS library
      if (config!.js_library_url && !document.querySelector(`script[src="${config!.js_library_url}"]`)) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = config!.js_library_url!;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load payment JS"));
          document.head.appendChild(script);
        });
      }

      if (destroyed) return;

      // Try to import PaymentForm from the SDK.
      // Use a variable for the module path so TypeScript / bundler does not
      // attempt to resolve the subpath export at build time (it may not
      // exist in the SDK yet).
      try {
        const paymentFormPath = "@stadian/storefront-sdk/payment-form";
        const mainPath = "@stadian/storefront-sdk";
        const mod: Record<string, unknown> = await import(
          /* webpackIgnore: true */ paymentFormPath
        ).catch(() => import(/* webpackIgnore: true */ mainPath));

        const PaymentForm = mod.PaymentForm as
          | (new (cfg: {
              publicKey: string;
              gatewayType: string;
              formConfig: Record<string, unknown>;
            }) => PaymentFormInstance)
          | undefined;

        if (!PaymentForm || destroyed) return;

        const instance = new PaymentForm({
          publicKey: config!.public_key!,
          gatewayType: config!.gateway_type!,
          formConfig: config!.form_config,
        });

        const containers: { card?: string; ach?: string } = {};
        if (cardContainerRef.current) containers.card = `#${cardContainerRef.current.id}`;
        if (achContainerRef.current && config!.ach_enabled)
          containers.ach = `#${achContainerRef.current.id}`;

        instance.mount(containers);
        formRef.current = instance;
        setFormReady(true);
      } catch {
        // PaymentForm not yet available in SDK — the containers stay empty
        // and getPaymentData() will return an empty object.
      }
    }

    init();

    return () => {
      destroyed = true;
      if (formRef.current) {
        formRef.current.destroy();
        formRef.current = null;
      }
      setFormReady(false);
    };
  }, [config]);

  /* ---- Expose getPaymentData to the parent ----------------------- */
  const getPaymentData = useCallback(async (): Promise<PaymentData> => {
    // No gateway configured — manual / payment-pending flow
    if (!config?.gateway_enabled) {
      return {};
    }

    // Redirect mode — payment happens after order placement
    if (config.checkout_mode === "redirect") {
      return { paymentFlow: "redirect" };
    }

    // Stored method selected
    if (selectedMethod) {
      return { storedPaymentMethodId: selectedMethod };
    }

    // Embedded tokenisation
    if (!formReady) {
      throw new Error("Payment form is still loading. Please wait a moment and try again.");
    }

    if (formRef.current) {
      const result = await formRef.current.tokenize();
      return {
        paymentToken: result.token,
        paymentType: result.type,
        savePaymentMethod: isAuthenticated ? saveCard : undefined,
      };
    }

    // Fallback — form not mounted (SDK not available yet)
    throw new Error("Payment form is still loading. Please wait a moment and try again.");
  }, [config, selectedMethod, saveCard, isAuthenticated, formReady]);

  const getBillingState = useCallback((): { sameAsShipping: boolean; billingAddress?: Address } => {
    if (sameAsShipping) return { sameAsShipping: true as const, billingAddress: undefined };
    const v = (n: string) =>
      (document.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="billing_${n}"]`)?.value ?? "");
    return {
      sameAsShipping: false as const,
      billingAddress: {
        line1: v("line1"),
        line2: v("line2") || undefined,
        city: v("city"),
        state: v("state"),
        zip: v("zip"),
        country: v("country"),
      },
    };
  }, [sameAsShipping]);

  useImperativeHandle(ref, () => ({ getPaymentData, getBillingState }), [getPaymentData, getBillingState]);

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  // No gateway — manual payment fallback
  if (!config?.gateway_enabled) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950/30">
          <p className="text-sm text-muted-foreground">
            No payment is collected now. Your order will be placed as{" "}
            <strong>payment pending</strong>, and our team will email you with
            payment details and next steps to complete it.
          </p>
        </div>
        <BillingAddress
          sameAsShipping={sameAsShipping}
          onSameAsShippingChange={setSameAsShipping}
          errors={billingErrors}
          onValidityRecheck={onValidityRecheck}
          showErrors={showErrors}
        />
      </div>
    );
  }

  // Redirect mode
  if (config.checkout_mode === "redirect") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          You will be redirected to our secure payment provider to complete
          your purchase after placing the order.
        </p>
        <BillingAddress
          sameAsShipping={sameAsShipping}
          onSameAsShippingChange={setSameAsShipping}
          errors={billingErrors}
          onValidityRecheck={onValidityRecheck}
          showErrors={showErrors}
        />
      </div>
    );
  }

  // Embedded mode
  const showNewForm = !selectedMethod;

  return (
    <div className="flex flex-col gap-4">
      {/* Saved methods (authenticated users only) */}
      {isAuthenticated && storedMethods.length > 0 && (
        <StoredMethods
          methods={storedMethods}
          selected={selectedMethod}
          onSelect={setSelectedMethod}
        />
      )}

      {/* New payment form */}
      {showNewForm && (
        <>
          {/* Card / ACH toggle */}
          {config.ach_enabled && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentType("card")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  paymentType === "card"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Credit / Debit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("ach")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  paymentType === "ach"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Bank Account (ACH)
              </button>
            </div>
          )}

          {/* Card fields container */}
          <div
            id="payment-card-container"
            ref={cardContainerRef}
            className={paymentType === "card" ? "min-h-[120px]" : "hidden"}
          />

          {/* ACH fields container */}
          {config.ach_enabled && (
            <div
              id="payment-ach-container"
              ref={achContainerRef}
              className={paymentType === "ach" ? "min-h-[120px]" : "hidden"}
            />
          )}

          {!formReady && (
            <p className="text-sm text-muted-foreground">
              Loading payment form...
            </p>
          )}

          {/* Save card checkbox for authenticated users */}
          {isAuthenticated && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="size-4 accent-primary"
              />
              Save this payment method for future orders
            </label>
          )}
        </>
      )}

      {/* Billing address */}
      <div className="pt-2">
        <Label className="mb-3 block">Billing Address</Label>
        <BillingAddress
          sameAsShipping={sameAsShipping}
          onSameAsShippingChange={setSameAsShipping}
          errors={billingErrors}
          onValidityRecheck={onValidityRecheck}
          showErrors={showErrors}
        />
      </div>
    </div>
  );
});

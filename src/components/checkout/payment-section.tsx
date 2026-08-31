"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import type {
  ManualPaymentMethod,
  PaymentClientConfig,
  StoredPaymentMethod,
} from "@/app/actions/payments";
import type { Address } from "@/app/checkout/checkout-logic";
import { CreditCard, Lock } from "lucide-react";
import {
  type CardBrand,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  formatCvv,
  cvvMaxLength,
} from "./card-format";
import { manualFieldLabel } from "./manual-payment";
import { StoredMethods } from "./stored-methods";
import { BillingAddress } from "./billing-address";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/** Small recognizable card-brand marks (inline SVG, no bundled assets).
    Once a brand is detected from the entered number, the match is highlighted
    and the others dim. */
function CardBrands({ active = "unknown" }: { active?: CardBrand }) {
  const shown: CardBrand[] = ["visa", "mastercard", "amex"];
  const highlighting = shown.includes(active);
  const dim = (brand: CardBrand) =>
    highlighting && active !== brand ? "opacity-25" : "opacity-100";
  return (
    <div className="flex shrink-0 items-center gap-1" aria-hidden>
      {/* Visa */}
      <svg
        viewBox="0 0 32 20"
        className={`h-5 w-8 rounded-[3px] transition-opacity ${dim("visa")}`}
      >
        <rect width="32" height="20" rx="3" fill="#1434CB" />
        <text
          x="16"
          y="14"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="9"
          fontStyle="italic"
          fontWeight="700"
          fill="#fff"
        >
          VISA
        </text>
      </svg>
      {/* Mastercard */}
      <svg
        viewBox="0 0 32 20"
        className={`h-5 w-8 rounded-[3px] bg-[#F7F7F7] transition-opacity ${dim("mastercard")}`}
      >
        <circle cx="13" cy="10" r="6" fill="#EB001B" />
        <circle cx="19" cy="10" r="6" fill="#F79E1B" fillOpacity="0.85" />
      </svg>
      {/* Amex */}
      <svg
        viewBox="0 0 32 20"
        className={`h-5 w-8 rounded-[3px] transition-opacity ${dim("amex")}`}
      >
        <rect width="32" height="20" rx="3" fill="#1F72CD" />
        <text
          x="16"
          y="13"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="6"
          fontWeight="700"
          fill="#fff"
        >
          AMEX
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payment field — one labelled slot, styled by the storefront.       */
/*  Authorize.Net → a real <input> we own; NMI → a container the SDK   */
/*  fills with a Collect.js iframe (matched height/border so it looks  */
/*  identical to our inputs).                                          */
/* ------------------------------------------------------------------ */

function PaymentField({
  id,
  label,
  isIframe,
  className,
  inputProps,
}: {
  id: string;
  label: string;
  isIframe: boolean;
  className?: string;
  inputProps?: ComponentProps<typeof Input>;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={isIframe ? undefined : id}>{label}</Label>
      {isIframe ? (
        <div
          id={id}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1"
        />
      ) : (
        <Input id={id} {...inputProps} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public API exposed via ref                                        */
/* ------------------------------------------------------------------ */

export interface PaymentData {
  /** Manual/offline method key ("zelle", "ach", …) when no gateway is used. */
  paymentMethod?: string;
  paymentToken?: string;
  paymentType?: "card" | "ach";
  paymentFlow?: "embedded" | "redirect";
  storedPaymentMethodId?: string;
  savePaymentMethod?: boolean;
}

export interface PaymentSectionHandle {
  getPaymentData: () => Promise<PaymentData>;
  getBillingState: () => { sameAsShipping: boolean; billingAddress?: Address };
  /** The offline method the buyer picked, or null. Synchronous on purpose:
   *  handleSubmit validates it before its first await, while the form event's
   *  currentTarget is still live. */
  getManualSelection: () => string | null;
}

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface PaymentSectionProps {
  config: PaymentClientConfig | null;
  storedMethods: StoredPaymentMethod[];
  /** Offline methods the store accepts (Zelle, ACH, …). Used when no card
   *  gateway is configured — the buyer picks one and pays after ordering. */
  manualMethods: ManualPaymentMethod[];
  /** Fired when the buyer picks an offline method, so the page can clear the
   *  "choose how you'd like to pay" error it raised on the blocked submit. */
  onManualMethodChange?: () => void;
  isAuthenticated: boolean;
  billingErrors?: Record<string, string | undefined>;
  onValidityRecheck?: () => void;
  showErrors?: boolean;
  /** Whether the payment section is currently on-screen. The SDK form is only
   *  mounted once visible so gateways that inject iframes (NMI/Collect.js) get a
   *  laid-out target rather than a display:none subtree. Defaults to true. */
  visible?: boolean;
}

/* ------------------------------------------------------------------ */
/*  SDK PaymentForm contract (tokenization only).                      */
/*  The storefront owns all markup + styling; the platform declares    */
/*  which gateway is active via `config.gateway_type`.                 */
/* ------------------------------------------------------------------ */

// DOM element ids the SDK binds to. For Authorize.Net (Accept.js) these are our
// own <input> elements; for NMI (Collect.js) they are container <div>s the SDK
// fills with secure iframes. Either way the storefront renders and styles them.
const CARD_FIELD_IDS = {
  cardNumber: "sf-card-number",
  cardExpiry: "sf-card-expiry",
  cardCvv: "sf-card-cvv",
} as const;
const ACH_FIELD_IDS = {
  accountNumber: "sf-ach-account",
  routingNumber: "sf-ach-routing",
} as const;

interface PaymentFormInstance {
  destroy: () => void;
  tokenize: () => Promise<{ token: string; payment_type: "card" | "ach" }>;
}

interface PaymentFormStatic {
  mount: (
    config: PaymentClientConfig,
    containerIds: Partial<
      Record<
        "cardNumber" | "cardExpiry" | "cardCvv" | "accountNumber" | "routingNumber",
        string
      >
    >,
  ) => Promise<PaymentFormInstance>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export const PaymentSection = forwardRef<
  PaymentSectionHandle,
  PaymentSectionProps
>(function PaymentSection({ config, storedMethods, manualMethods, onManualMethodChange, isAuthenticated, billingErrors, onValidityRecheck, showErrors, visible = true }, ref) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(
    storedMethods.find((m) => m.is_default)?.id ?? null,
  );
  const [paymentType, setPaymentType] = useState<"card" | "ach">("card");
  // Offline method the buyer chose. Preselect when there is only one — a
  // single-option radio group is a formality, not a decision.
  const [manualMethod, setManualMethod] = useState<string | null>(
    manualMethods.length === 1 ? manualMethods[0].key : null,
  );
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [saveCard, setSaveCard] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Controlled card values so we can format as the shopper types (Authorize.Net
  // only — NMI collects inside its own iframes).
  const [cardNumberVal, setCardNumberVal] = useState("");
  const [expiryVal, setExpiryVal] = useState("");
  const [cvvVal, setCvvVal] = useState("");

  const formRef = useRef<PaymentFormInstance | null>(null);

  /* ---- Mount the SDK tokenizer onto our own rendered fields ------- */
  useEffect(() => {
    // The platform declares the active gateway + mode via `config`. We only mount
    // the embedded on-page tokenizer; redirect and stored-method flows need none.
    if (!config?.gateway_enabled || config.checkout_mode !== "embedded") return;
    if (!config.js_library_url || !config.public_key) return;
    if (selectedMethod) return; // a saved method is selected — no new-card form to mount
    // Only mount once the section is on-screen: iframe gateways (NMI/Collect.js)
    // need a laid-out target, not a display:none subtree (see `visible` prop).
    if (!visible) return;

    let destroyed = false;

    async function init() {
      try {
        // Static specifier (no webpackIgnore) so the bundler resolves the vendored
        // SDK at build time — a bare specifier left for the browser can't be
        // resolved at runtime (that was the original "stuck loading" bug).
        const mod = await import("@stadian/storefront-sdk/payment-form");
        const PaymentForm = (mod as { PaymentForm?: PaymentFormStatic }).PaymentForm;
        if (!PaymentForm?.mount || destroyed) return;

        // Hand the SDK the ids of the fields we rendered for the current method.
        const containerIds =
          paymentType === "ach"
            ? {
                accountNumber: ACH_FIELD_IDS.accountNumber,
                routingNumber: ACH_FIELD_IDS.routingNumber,
              }
            : {
                cardNumber: CARD_FIELD_IDS.cardNumber,
                cardExpiry: CARD_FIELD_IDS.cardExpiry,
                cardCvv: CARD_FIELD_IDS.cardCvv,
              };

        const instance = await PaymentForm.mount(config!, containerIds);
        if (destroyed) {
          instance.destroy();
          return;
        }
        formRef.current = instance;
        setFormReady(true);
      } catch (err) {
        // Surface the failure instead of leaving a perpetual "loading" spinner.
        console.error("Failed to initialize payment form:", err);
        if (!destroyed) {
          setFormError(
            "We couldn't load the secure payment form. Please refresh and try again.",
          );
        }
      }
    }

    // Reset to a clean slate whenever the gateway/method changes, then (re)mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset before the async mount
    setFormReady(false);
    setFormError(null);
    init();

    return () => {
      destroyed = true;
      if (formRef.current) {
        formRef.current.destroy();
        formRef.current = null;
      }
      setFormReady(false);
    };
  }, [config, paymentType, selectedMethod, visible]);

  /* ---- Expose getPaymentData to the parent ----------------------- */
  const getPaymentData = useCallback(async (): Promise<PaymentData> => {
    // No gateway configured — the buyer pays offline. Send the method they
    // picked: the platform only emails payment instructions (and alerts the
    // store) for a recognised manual method, so an empty value here means the
    // buyer is never told where to send the money.
    if (!config?.gateway_enabled) {
      if (manualMethods.length > 0) {
        if (!manualMethod) {
          throw new Error("Please choose how you'd like to pay.");
        }
        return { paymentMethod: manualMethod };
      }
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
        paymentType: result.payment_type,
        savePaymentMethod: isAuthenticated ? saveCard : undefined,
      };
    }

    // Fallback — form not mounted (SDK not available yet)
    throw new Error("Payment form is still loading. Please wait a moment and try again.");
  }, [config, selectedMethod, saveCard, isAuthenticated, formReady, manualMethod, manualMethods]);

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

  const getManualSelection = useCallback(() => manualMethod, [manualMethod]);

  useImperativeHandle(
    ref,
    () => ({ getPaymentData, getBillingState, getManualSelection }),
    [getPaymentData, getBillingState, getManualSelection],
  );

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  // No gateway — the buyer pays offline (Zelle, ACH, wire, check...).
  if (!config?.gateway_enabled) {
    const selected = manualMethods.find((m) => m.key === manualMethod);
    return (
      <div className="flex flex-col gap-4">
        {manualMethods.length > 0 ? (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">
                How would you like to pay?
              </legend>
              {manualMethods.map((method) => (
                <label
                  key={method.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                    manualMethod === method.key
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="manual_payment_method"
                    value={method.key}
                    checked={manualMethod === method.key}
                    onChange={() => {
                      setManualMethod(method.key);
                      onManualMethodChange?.();
                      onValidityRecheck?.();
                    }}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium">{method.label}</span>
                </label>
              ))}
            </fieldset>

            {showErrors && !manualMethod && (
              <p className="text-sm text-destructive">
                Please choose how you&apos;d like to pay.
              </p>
            )}

            {selected && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Place your order first. We&apos;ll email you these details
                  along with your order number, which you should include as the
                  payment reference so we can match it to your order.
                </p>
                {selected.customer_instructions && (
                  <p className="mb-3 text-sm">{selected.customer_instructions}</p>
                )}
                <dl className="flex flex-col gap-1.5">
                  {Object.entries(selected.details).map(([field, value]) => (
                    <div key={field} className="flex flex-wrap gap-x-2 text-sm">
                      <dt className="font-medium">{manualFieldLabel(field)}:</dt>
                      <dd className="text-muted-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950/30">
            <p className="text-sm text-muted-foreground">
              No payment is collected now. Your order will be placed as{" "}
              <strong>payment pending</strong>, and our team will email you with
              payment details and next steps to complete it.
            </p>
          </div>
        )}
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
  // NMI collects card data in Collect.js iframes; Authorize.Net (Accept.js) reads
  // our own inputs. The platform tells us which via config.gateway_type.
  const isNmi = config.gateway_type === "nmi";
  const cardBrand = detectCardBrand(cardNumberVal.replace(/\D/g, ""));

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

          {/* Card fields. For Authorize.Net we render our own styled inputs
              (Accept.js reads them); for NMI these ids are container divs the
              Collect.js SDK fills with secure iframes. */}
          {paymentType === "card" && (
            <div className="flex flex-col gap-1.5">
              {/* Unified card widget — one bordered group, borderless inner
                  inputs. For Authorize.Net these are our own <input>s (Accept.js
                  reads them); for NMI the ids are slots Collect.js fills with
                  iframes. */}
              <div className="overflow-hidden rounded-xl border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
                {/* Card number */}
                <div className="flex items-center gap-2.5 px-3">
                  <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {isNmi ? (
                    <div id={CARD_FIELD_IDS.cardNumber} className="h-11 flex-1" />
                  ) : (
                    <input
                      id={CARD_FIELD_IDS.cardNumber}
                      name="sf_cc_number"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="Card number"
                      aria-label="Card number"
                      value={cardNumberVal}
                      onChange={(e) => setCardNumberVal(formatCardNumber(e.target.value))}
                      className="h-11 flex-1 bg-transparent text-sm tabular-nums outline-none placeholder:text-muted-foreground"
                    />
                  )}
                  <CardBrands active={cardBrand} />
                </div>
                <div className="h-px bg-border" />
                {/* Expiry | CVV */}
                <div className="flex">
                  <div className="flex-1 px-3">
                    {isNmi ? (
                      <div id={CARD_FIELD_IDS.cardExpiry} className="h-11 w-full" />
                    ) : (
                      <input
                        id={CARD_FIELD_IDS.cardExpiry}
                        name="sf_cc_expiry"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM / YY"
                        aria-label="Card expiry date"
                        value={expiryVal}
                        onChange={(e) => setExpiryVal(formatExpiry(e.target.value))}
                        className="h-11 w-full bg-transparent text-sm tabular-nums outline-none placeholder:text-muted-foreground"
                      />
                    )}
                  </div>
                  <div className="w-px bg-border" />
                  <div className="flex flex-1 items-center gap-2 px-3">
                    {isNmi ? (
                      <div id={CARD_FIELD_IDS.cardCvv} className="h-11 flex-1" />
                    ) : (
                      <input
                        id={CARD_FIELD_IDS.cardCvv}
                        name="sf_cc_cvv"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="CVV"
                        aria-label="Card security code"
                        value={cvvVal}
                        onChange={(e) =>
                          setCvvVal(formatCvv(e.target.value, cvvMaxLength(cardBrand)))
                        }
                        className="h-11 w-full bg-transparent text-sm tabular-nums outline-none placeholder:text-muted-foreground"
                      />
                    )}
                    <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACH fields */}
          {config.ach_enabled && paymentType === "ach" && (
            <div className="flex flex-col gap-3">
              <PaymentField
                id={ACH_FIELD_IDS.accountNumber}
                label="Account number"
                isIframe={isNmi}
                inputProps={{ inputMode: "numeric", placeholder: "Account number" }}
              />
              <PaymentField
                id={ACH_FIELD_IDS.routingNumber}
                label="Routing number"
                isIframe={isNmi}
                inputProps={{ inputMode: "numeric", placeholder: "Routing number" }}
              />
            </div>
          )}

          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : !formReady ? (
            <p className="text-sm text-muted-foreground">
              Loading secure payment form…
            </p>
          ) : null}

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

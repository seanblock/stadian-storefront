# Production Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the storefront + vendored SDK to the existing backend so checkout works correctly for guest and authenticated buyers — billing addresses, payment-failure handling, shipping selection + cost, inline guest confirmation, and regulated-product gating — with zero backend changes.

**Architecture:** Three phases on `finish/checkout-address`. Phase 1 is storefront-only correctness (extract + unit-test the submit logic, fix billing via the `PaymentSection` ref, handle payment failure, guard submit, inline guest confirmation). Phase 2 adds vendored-SDK params (`shippingMethodId`, `customerToken`) + a shipping-estimate method, and wires shipping selection + auth token. Phase 3 wires the existing `checkout/flow` to gate regulated products. Risky submit logic is extracted into pure functions and unit-tested with vitest; e2e covers up-to-submit only; a manual test order on the Vercel preview confirms the live happy path.

**Tech Stack:** Next.js (bleeding-edge — read `node_modules/next/dist/docs/` before writing Next-specific code), Base UI (`@base-ui/react`, NOT Radix), vendored `@stadian/storefront-sdk` (built `dist/` only — edit dist directly), Playwright (e2e), vitest (new, unit).

## Global Constraints

- **No backend changes** (`peptide-platform` untouched). Wire to existing endpoints only.
- **Vendored SDK = edit `vendor/storefront-sdk/dist/*.js` + `dist/*.d.ts` directly; BUMP `vendor/storefront-sdk/package.json` version AND set the lock node `node_modules/@stadian/storefront-sdk` version to match**, else Vercel's build cache serves a stale SDK (known failure). After editing, `rm -rf node_modules/@stadian/storefront-sdk && npm ci`.
- **Storefront reads the LIVE tenant** — never place a real order in automated tests. E2e stops before clicking "Place Order".
- **AGENTS.md:** "This is NOT the Next.js you know" — read the relevant `node_modules/next/dist/docs/` guide before writing Next-specific code.
- Gates before preview: `npm run lint` (0 errors), `npm run typecheck` (0 errors), `npm run build`, `npm run test:unit` (vitest), `npm test` (Playwright). Commit after each green task. Never `git push` directly — ship is gated + preview-first.
- Field names already in use: shipping address fields submit as `line1/line2/city/state/zip/country`; billing as `billing_*` (via `AddressFields prefix`).

## File Structure

- `vitest.config.ts` — NEW: unit test config.
- `src/app/checkout/checkout-logic.ts` — NEW: pure functions `buildOrderPayload`, `resolveCheckoutResult` (extracted from `handleSubmit`).
- `src/app/checkout/checkout-logic.test.ts` — NEW: vitest unit tests.
- `src/app/checkout/page.tsx` — MODIFY: use extracted logic; read billing from ref; handle payment-failure/redirect/inline-confirmation; shipping selection; flow gating.
- `src/components/checkout/payment-section.tsx` — MODIFY: extend `PaymentSectionHandle` to expose `sameAsShipping` + billing address; guard `getPaymentData` on `formReady`.
- `src/components/checkout/order-confirmation.tsx` — NEW: inline confirmation from a returned order.
- `src/components/checkout/shipping-methods.tsx` — NEW: shipping option selector.
- `src/components/checkout/checkout-flow-steps.tsx` — NEW: compliance step list + gating.
- `src/components/cart/order-summary.tsx` — MODIFY: shipping line.
- `src/app/actions/checkout.ts` — MODIFY: pass `customerToken` + `shippingMethodId`.
- `src/app/actions/shipping.ts` — NEW: `getShippingOptions` server action.
- `src/app/actions/checkout-flow.ts` — NEW: `getCheckoutFlow` server action.
- `vendor/storefront-sdk/dist/index.js` + `dist/index.d.ts` + `dist/types.d.ts` + `package.json` — MODIFY: SDK params/types/version.
- `e2e/checkout.spec.ts` — NEW: up-to-submit e2e.

---

## Task 1: Add vitest unit-test infrastructure

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts + devDeps)
- Create: `src/app/checkout/checkout-logic.test.ts` (smoke)

**Interfaces:**
- Produces: `npm run test:unit` runs vitest over `**/*.test.ts(x)` EXCLUDING `e2e/**`.

- [ ] **Step 1: Add vitest config** that excludes the Playwright `e2e/` dir (so it doesn't pick up `.spec.ts`):
```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    environment: "node",
  },
});
```

- [ ] **Step 2: Add scripts + dep.** In `package.json`, add `"test:unit": "vitest run"` to scripts. Add `vitest` to devDependencies (use the version already resolvable; run `npm install vitest --save-dev --package-lock-only` is NOT enough — actually install: `npm install -D vitest`). Confirm it does not collide with the Playwright `"test"` script.

- [ ] **Step 3: Smoke test** to prove the runner works:
```ts
// src/app/checkout/checkout-logic.test.ts
import { describe, it, expect } from "vitest";
describe("vitest", () => { it("runs", () => { expect(1 + 1).toBe(2); }); });
```

- [ ] **Step 4: Run it**
Run: `npm run test:unit`
Expected: 1 passed.

- [ ] **Step 5: Confirm Playwright still excludes unit tests** (vitest config `exclude: ["e2e/**"]`; Playwright `testDir: "./e2e"`): `npm test -- --list` shows only e2e specs.

- [ ] **Step 6: Commit**
```bash
git add vitest.config.ts package.json package-lock.json src/app/checkout/checkout-logic.test.ts
git commit -m "test: add vitest unit-test runner (excludes e2e)"
```

---

## Task 2: Extract + unit-test the checkout submit logic

**Files:**
- Create: `src/app/checkout/checkout-logic.ts`
- Modify: `src/app/checkout/checkout-logic.test.ts`

**Interfaces:**
- Consumes: SDK `StorefrontOrder` (extended in Task 8 with `payment_status`/`payment_error`/`redirect_url`); for now type the inputs locally so this task is independent.
- Produces:
  - `type Address = { line1: string; line2?: string; city: string; state: string; zip: string; country: string }`
  - `type CheckoutResult = { kind: "redirect"; url: string } | { kind: "failed"; message: string } | { kind: "success"; orderId: string }`
  - `resolveCheckoutResult(order, paymentFlow): CheckoutResult` — `order` typed as `{ id: string; payment_status?: string | null; payment_error?: string | null; redirect_url?: string | null }`.
  - `buildOrderPayload(input): { customerEmail; shippingAddress; billingAddress?; shippingMethodId?; customerToken?; notes? } & PaymentData` — pure assembler.

- [ ] **Step 1: Write failing tests** for the result-branching (the correctness core):
```ts
// src/app/checkout/checkout-logic.test.ts (replace smoke)
import { describe, it, expect } from "vitest";
import { resolveCheckoutResult, buildOrderPayload } from "./checkout-logic";

describe("resolveCheckoutResult", () => {
  it("returns failed when payment_status is failed, with the error message", () => {
    const r = resolveCheckoutResult(
      { id: "o1", payment_status: "failed", payment_error: "Card declined" }, "embedded");
    expect(r).toEqual({ kind: "failed", message: "Card declined" });
  });
  it("returns failed with a generic message when no payment_error", () => {
    const r = resolveCheckoutResult({ id: "o1", payment_status: "failed" }, "embedded");
    expect(r.kind).toBe("failed");
    expect((r as { message: string }).message).toMatch(/payment/i);
  });
  it("returns redirect when redirect_url present and flow is redirect", () => {
    const r = resolveCheckoutResult(
      { id: "o1", payment_status: "pending", redirect_url: "https://pay.example/x" }, "redirect");
    expect(r).toEqual({ kind: "redirect", url: "https://pay.example/x" });
  });
  it("returns success otherwise", () => {
    const r = resolveCheckoutResult({ id: "o1", payment_status: "success" }, "embedded");
    expect(r).toEqual({ kind: "success", orderId: "o1" });
  });
});

describe("buildOrderPayload", () => {
  const shipping = { line1: "1 A St", city: "Austin", state: "TX", zip: "78701", country: "US" };
  it("omits billingAddress when sameAsShipping", () => {
    const p = buildOrderPayload({
      email: "a@b.com", shipping, sameAsShipping: true, billing: undefined,
      shippingMethodId: "m1", customerToken: undefined, notes: undefined, paymentData: {},
    });
    expect(p.billingAddress).toBeUndefined();
    expect(p.shippingMethodId).toBe("m1");
    expect(p.customerEmail).toBe("a@b.com");
  });
  it("includes billingAddress + customerToken when provided", () => {
    const billing = { line1: "2 B St", city: "Reno", state: "NV", zip: "89501", country: "US" };
    const p = buildOrderPayload({
      email: "a@b.com", shipping, sameAsShipping: false, billing,
      shippingMethodId: undefined, customerToken: "jwt123", notes: "hi", paymentData: { paymentFlow: "redirect" },
    });
    expect(p.billingAddress).toEqual(billing);
    expect(p.customerToken).toBe("jwt123");
    expect(p.paymentFlow).toBe("redirect");
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (module not found): `npm run test:unit`

- [ ] **Step 3: Implement** `src/app/checkout/checkout-logic.ts`:
```ts
import type { PaymentData } from "@/components/checkout/payment-section";

export interface Address {
  line1: string; line2?: string; city: string; state: string; zip: string; country: string;
}

interface OrderResultInput {
  id: string;
  payment_status?: string | null;
  payment_error?: string | null;
  redirect_url?: string | null;
}

export type CheckoutResult =
  | { kind: "redirect"; url: string }
  | { kind: "failed"; message: string }
  | { kind: "success"; orderId: string };

export function resolveCheckoutResult(
  order: OrderResultInput,
  paymentFlow: PaymentData["paymentFlow"],
): CheckoutResult {
  if (order.payment_status === "failed") {
    return { kind: "failed", message: order.payment_error || "Your payment could not be processed. Please try again." };
  }
  if (paymentFlow === "redirect" && order.redirect_url) {
    return { kind: "redirect", url: order.redirect_url };
  }
  return { kind: "success", orderId: order.id };
}

export interface BuildPayloadInput {
  email: string;
  shipping: Address;
  sameAsShipping: boolean;
  billing: Address | undefined;
  shippingMethodId: string | undefined;
  customerToken: string | undefined;
  notes: string | undefined;
  paymentData: PaymentData;
}

export function buildOrderPayload(input: BuildPayloadInput) {
  return {
    customerEmail: input.email,
    shippingAddress: input.shipping,
    billingAddress: input.sameAsShipping ? undefined : input.billing,
    shippingMethodId: input.shippingMethodId,
    customerToken: input.customerToken,
    notes: input.notes || undefined,
    ...input.paymentData,
  };
}
```

- [ ] **Step 4: Run, expect PASS**: `npm run test:unit` → 6 passing.

- [ ] **Step 5: Commit**
```bash
git add src/app/checkout/checkout-logic.ts src/app/checkout/checkout-logic.test.ts
git commit -m "feat(checkout): extract + unit-test pure submit logic (result branching, payload)"
```

---

## Task 3: Expose billing address via the PaymentSection ref

**Files:**
- Modify: `src/components/checkout/payment-section.tsx`

**Interfaces:**
- Consumes: existing `BillingAddress` (renders `AddressFields prefix="billing_"` when `!sameAsShipping`); `sameAsShipping` state already at line 70.
- Produces (extended handle): `PaymentSectionHandle` gains `getBillingState(): { sameAsShipping: boolean; billingAddress?: Address }`. Reads the billing inputs from the DOM by their `name="billing_*"` within the section (the fields are inside the checkout `<form>`), returning `undefined` when `sameAsShipping`.

- [ ] **Step 1: Extend the handle interface + imperative handle.** Add to `PaymentSectionHandle`:
```ts
import type { Address } from "@/app/checkout/checkout-logic";
export interface PaymentSectionHandle {
  getPaymentData: () => Promise<PaymentData>;
  getBillingState: () => { sameAsShipping: boolean; billingAddress?: Address };
}
```
Implement `getBillingState` inside the component (it can read its own `sameAsShipping` state + the mounted billing `AddressFields` values via `document.querySelector('[name="billing_line1"]')` etc., scoped to the form). Wire into `useImperativeHandle(ref, () => ({ getPaymentData, getBillingState }), [getPaymentData, getBillingState])`.
```ts
const getBillingState = useCallback(() => {
  if (sameAsShipping) return { sameAsShipping: true as const, billingAddress: undefined };
  const v = (n: string) => (document.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="billing_${n}"]`)?.value ?? "");
  return {
    sameAsShipping: false as const,
    billingAddress: { line1: v("line1"), line2: v("line2") || undefined, city: v("city"), state: v("state"), zip: v("zip"), country: v("country") },
  };
}, [sameAsShipping]);
```
(Note: Base UI Select renders a hidden input with the `name`, so `querySelector('[name="billing_state"]')` resolves the selected value — confirmed in the closed-state work.)

- [ ] **Step 2: Verify build + types**: `npm run typecheck` → 0 errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/checkout/payment-section.tsx
git commit -m "feat(checkout): expose billing state via PaymentSection ref"
```

---

## Task 4: Guard submit until the payment form is ready

**Files:**
- Modify: `src/components/checkout/payment-section.tsx`

**Interfaces:**
- Consumes: existing `formReady` state (line 72), `getPaymentData` (line 154).
- Produces: `getPaymentData` throws `new Error("Payment form is still loading. Please wait a moment.")` when in embedded mode and `!formReady`, instead of returning `{}`.

- [ ] **Step 1: Locate the embedded branch** of `getPaymentData` (where it currently `return {}` when the embedded form isn't ready / tokenize fails). Change the not-ready path to throw:
```ts
// inside getPaymentData, embedded mode, before tokenize:
if (!formReady) {
  throw new Error("Payment form is still loading. Please wait a moment and try again.");
}
```
Keep stored-method and redirect branches unchanged. (The thrown error is caught by `checkout/page.tsx` `handleSubmit` and shown via `setError`.)

- [ ] **Step 2: Typecheck** `npm run typecheck` → 0 errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/checkout/payment-section.tsx
git commit -m "fix(checkout): throw if payment form not ready instead of placing order without payment"
```

---

## Task 5: Inline guest order confirmation component

**Files:**
- Create: `src/components/checkout/order-confirmation.tsx`

**Interfaces:**
- Consumes: a returned order `{ id, order_number?, status, total, payment_status? }` + the buyer email.
- Produces: `<OrderConfirmation order={...} email={...} />` — a self-contained success view (order number, status, total, "a confirmation was sent to {email}", link to continue shopping). No data fetch.

- [ ] **Step 1: Implement** a presentational component (mirror existing card styling from `order-summary.tsx`):
```tsx
"use client";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ConfirmedOrder {
  id: string; order_number?: number | null; status: string; total: number; payment_status?: string | null;
}

export function OrderConfirmation({ order, email }: { order: ConfirmedOrder; email: string }) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader><CardTitle>Thank you — your order is placed</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm">Order {order.order_number ? `#${order.order_number}` : order.id}</p>
          <p className="text-sm text-muted-foreground">Status: {order.status}</p>
          <p className="text-sm">Total: <span className="tabular-nums">{formatCurrency(order.total)}</span></p>
          <p className="text-sm text-muted-foreground">A confirmation was sent to {email}.</p>
          <Link href="/products" className="text-sm font-medium text-primary underline">Continue shopping</Link>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck** `npm run typecheck` → 0 errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/checkout/order-confirmation.tsx
git commit -m "feat(checkout): inline guest order confirmation component"
```

---

## Task 6: Wire result handling + inline confirmation into checkout page

**Files:**
- Modify: `src/app/checkout/page.tsx`

**Interfaces:**
- Consumes: `buildOrderPayload`, `resolveCheckoutResult` (Task 2); `getBillingState` (Task 3); `OrderConfirmation` (Task 5); `useAuth` for `isAuthenticated`.
- Produces: `handleSubmit` uses the extracted logic; on `failed` shows error + stays (does NOT clearSession); on `redirect` navigates to url; on `success` — authenticated → `/account/orders/{id}`, guest → render `<OrderConfirmation>` inline (sets a `confirmedOrder` state).

- [ ] **Step 1: Replace the inline submit body** to use the extracted helpers + ref billing. Key changes in `handleSubmit`:
```ts
const paymentData = paymentRef.current ? await paymentRef.current.getPaymentData() : {};
const { sameAsShipping, billingAddress } = paymentRef.current?.getBillingState() ?? { sameAsShipping: true, billingAddress: undefined };
const shipping = { line1: data.get("line1") as string, line2: (data.get("line2") as string) || undefined,
  city: data.get("city") as string, state: data.get("state") as string, zip: data.get("zip") as string, country: data.get("country") as string };
const payload = buildOrderPayload({
  email: data.get("email") as string, shipping, sameAsShipping, billing: billingAddress,
  shippingMethodId: selectedShippingMethodId, customerToken: undefined /* set in Task 10 */,
  notes: (data.get("notes") as string) || undefined, paymentData,
});
const order = await createOrder(sessionId, payload);
const result = resolveCheckoutResult(order, paymentData.paymentFlow);
if (result.kind === "failed") { setError(result.message); setSubmitting(false); return; }
clearSession();
if (result.kind === "redirect") { window.location.href = result.url; return; }
if (isAuthenticated) { router.push(`/account/orders/${result.orderId}`); return; }
setConfirmedOrder(order); // guest inline confirmation
```
Add `const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);` and `const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string | undefined>(undefined);`. Early-return `<OrderConfirmation order={confirmedOrder} email={confirmedOrder ? lastEmail : ""} />` when set (capture the submitted email into state for the confirmation). Remove the old `(order as unknown as {redirect_url}).redirect_url` block and the broken `billing_same`/`FormData` billing logic.

- [ ] **Step 2: Manual smoke (dev server).** `npm run dev`, add an item to cart, open `/checkout`, confirm it renders without runtime errors (do NOT place a real order). `npm run typecheck` → 0 errors; `npm run build` → success.

- [ ] **Step 3: Commit**
```bash
git add src/app/checkout/page.tsx
git commit -m "feat(checkout): handle payment failure/redirect + inline guest confirmation; billing from ref"
```

---

## Task 7: Vendored SDK — checkout params (shippingMethodId, customerToken) + order type

**Files:**
- Modify: `vendor/storefront-sdk/dist/index.js` (CheckoutResource.create)
- Modify: `vendor/storefront-sdk/dist/index.d.ts` (CheckoutCreateParams)
- Modify: `vendor/storefront-sdk/dist/types.d.ts` (StorefrontOrder)
- Modify: `vendor/storefront-sdk/package.json` (version bump) + `package-lock.json` lock node

**Interfaces:**
- Produces: `CheckoutCreateParams` gains `shippingMethodId?: string` and `customerToken?: string`; `create()` maps `shipping_method_id` into the body and, when `customerToken` is set, sends `headers: { Authorization: \`Bearer ${customerToken}\` }`. `StorefrontOrder` gains `payment_status?`, `payment_error?`, `redirect_url?`, `shipping_amount?`.

- [ ] **Step 1: Edit `dist/index.js` `create()`** to add the body field + auth header:
```js
create(params) {
    const options = {
        body: {
            session_token: params.sessionToken,
            customer_email: params.customerEmail,
            shipping_address: params.shippingAddress,
            billing_address: params.billingAddress,
            shipping_method_id: params.shippingMethodId,
            notes: params.notes,
            payment_method: params.paymentMethod,
            payment_reference: params.paymentReference,
            payment_token: params.paymentToken,
            payment_type: params.paymentType,
            payment_flow: params.paymentFlow,
            stored_payment_method_id: params.storedPaymentMethodId,
            save_payment_method: params.savePaymentMethod,
        },
    };
    if (params.customerToken) {
        options.headers = { Authorization: `Bearer ${params.customerToken}` };
    }
    return this.http.request("POST", "/checkout", options);
}
```

- [ ] **Step 2: Edit `dist/index.d.ts` `CheckoutCreateParams`** — add `shippingMethodId?: string;` and `customerToken?: string;`.

- [ ] **Step 3: Edit `dist/types.d.ts` `StorefrontOrder`** — add the optional fields (find the interface, add):
```ts
payment_status?: string | null;
payment_error?: string | null;
redirect_url?: string | null;
shipping_amount?: number;
```

- [ ] **Step 4: Bump version + sync lock + reinstall** (cache-bust, per global constraint):
```bash
cd vendor/storefront-sdk && node -e "const p=require('./package.json');p.version='1.0.2';require('fs').writeFileSync('./package.json',JSON.stringify(p,null,2)+'\n')" && cd ../..
# set lock node version to 1.0.2:
node -e "const f='package-lock.json';const l=require('./'+f);l.packages['node_modules/@stadian/storefront-sdk'].version='1.0.2';require('fs').writeFileSync(f,JSON.stringify(l,null,2)+'\n')"
rm -rf node_modules/@stadian/storefront-sdk && npm ci
```

- [ ] **Step 5: Verify** `npm run typecheck` → 0 errors (the `as unknown as` casts in page.tsx can now be removed where used).

- [ ] **Step 6: Commit**
```bash
git add vendor/storefront-sdk package-lock.json
git commit -m "feat(sdk): checkout shippingMethodId + customerToken (Bearer); StorefrontOrder payment fields; bump 1.0.2"
```

---

## Task 8: Vendored SDK — shipping estimate method + type

**Files:**
- Modify: `vendor/storefront-sdk/dist/index.js` (add to CheckoutResource or new ShippingResource), `dist/index.d.ts`, `dist/types.d.ts`
- Modify: `vendor/storefront-sdk/package.json` (version 1.0.3) + lock

**Interfaces:**
- Produces: `client.checkout.estimateShipping(sessionToken): Promise<ShippingEstimateResponse>` → `POST /shipping-estimate` body `{ session_token }`. `ShippingEstimateResponse = { options: ShippingOption[] }`, `ShippingOption = { method_id: string; method_name: string; price: number; is_free: boolean }`.

- [ ] **Step 1: Add the method** to `CheckoutResource` in `dist/index.js` (next to `getFlow`):
```js
estimateShipping(sessionToken) {
    return this.http.request("POST", "/shipping-estimate", { body: { session_token: sessionToken } });
}
```

- [ ] **Step 2: Types.** In `dist/types.d.ts` add:
```ts
export interface ShippingOption { method_id: string; method_name: string; price: number; is_free: boolean; }
export interface ShippingEstimateResponse { options: ShippingOption[]; }
```
In `dist/index.d.ts`: add `estimateShipping(sessionToken: string): Promise<ShippingEstimateResponse>;` to the CheckoutResource declaration and add `ShippingEstimateResponse` to the type import from `./types`.

- [ ] **Step 3: Bump to 1.0.3 + sync lock + reinstall** (same commands as Task 7 Step 4 with `1.0.3`).

- [ ] **Step 4: Verify** `npm run typecheck` → 0 errors.

- [ ] **Step 5: Commit**
```bash
git add vendor/storefront-sdk package-lock.json
git commit -m "feat(sdk): checkout.estimateShipping + shipping option types; bump 1.0.3"
```

---

## Task 9: Shipping options server action + component + order-summary line

**Files:**
- Create: `src/app/actions/shipping.ts`
- Create: `src/components/checkout/shipping-methods.tsx`
- Modify: `src/components/cart/order-summary.tsx`
- Modify: `src/app/checkout/page.tsx` (mount selector, pass selected id, pass cost to summary)

**Interfaces:**
- Consumes: SDK `estimateShipping` (Task 8); `getSessionId` (`@/lib/session`).
- Produces: `getShippingOptions(sessionId): Promise<ShippingOption[]>`; `<ShippingMethods options value onChange />`; `OrderSummary` accepts optional `shippingCost?: number`.

- [ ] **Step 1: Server action**:
```ts
"use server";
import { getStadianClient } from "@/lib/stadian";
import type { ShippingOption } from "@stadian/storefront-sdk";
export async function getShippingOptions(sessionId: string): Promise<ShippingOption[]> {
  try { return (await getStadianClient().checkout.estimateShipping(sessionId)).options; }
  catch { return []; }
}
```

- [ ] **Step 2: ShippingMethods component** — radio list (Base UI / native radios), shows `price` or "Free" (`is_free`), auto-selects first; if `options.length === 0` renders nothing; if `1`, auto-selects without radios. Calls `onChange(method_id)`.

- [ ] **Step 3: OrderSummary** — add optional `shippingCost?: number` prop; render a "Shipping" line (`Free` when 0/undefined-but-selected, else `formatCurrency`), and include it in the displayed total if your design shows a recomputed total (else leave total to the cart and show shipping as a separate line with a note "calculated at checkout"). Keep YAGNI — show the line, don't recompute server totals client-side.

- [ ] **Step 4: Wire into page.tsx** — on mount (after cart known) call `getShippingOptions(sessionId)` into state; render `<ShippingMethods>` in a "Shipping Method" card between Shipping Address and Payment; track `selectedShippingMethodId` (already added in Task 6); pass the selected option's price to `<OrderSummary shippingCost={...} />`.

- [ ] **Step 5: Verify** `npm run typecheck` + `npm run build` clean. Dev-server smoke: shipping options render on `/checkout` (do not place an order).

- [ ] **Step 6: Commit**
```bash
git add src/app/actions/shipping.ts src/components/checkout/shipping-methods.tsx src/components/cart/order-summary.tsx src/app/checkout/page.tsx
git commit -m "feat(checkout): shipping method selection + cost line"
```

---

## Task 10: Authenticated checkout — send the customer token

**Files:**
- Modify: `src/app/actions/checkout.ts`
- Modify: `src/app/checkout/page.tsx` (pass through; harmless since action reads token server-side)

**Interfaces:**
- Consumes: `getCustomerToken` (`@/app/actions/auth`); SDK `customerToken` param (Task 7).
- Produces: `createOrder` reads the customer JWT server-side and forwards it as `customerToken` so the backend attaches the order to the authenticated account.

- [ ] **Step 1: In `createOrder`** (server action), read the token and pass it to `checkout.create`:
```ts
import { getCustomerToken } from "@/app/actions/auth";
// ...inside createOrder, before client.checkout.create:
const customerToken = (await getCustomerToken()) ?? undefined;
// add to the create() call:
customerToken,
shippingMethodId: data.shippingMethodId,
```
Add `shippingMethodId?: string` to the `createOrder` `data` param type. (The page already passes `shippingMethodId` via `buildOrderPayload`; `customerToken` is resolved server-side so the page passes `undefined`.)

- [ ] **Step 2: Verify** `npm run typecheck` clean. Unit: existing `buildOrderPayload` test already covers `shippingMethodId` passthrough.

- [ ] **Step 3: Commit**
```bash
git add src/app/actions/checkout.ts src/app/checkout/page.tsx
git commit -m "feat(checkout): send customer Bearer token so authenticated orders attach to account"
```

---

## Task 11: Compliance flow gating

**Files:**
- Create: `src/app/actions/checkout-flow.ts`
- Create: `src/components/checkout/checkout-flow-steps.tsx`
- Modify: `src/app/checkout/page.tsx` (call flow after state known; gate Place Order; surface 422)

**Interfaces:**
- Consumes: existing SDK `checkout.getFlow(sessionToken, shippingState): Promise<CheckoutFlowResponse>`.
- Produces: `getCheckoutFlow(sessionId, state): Promise<CheckoutFlowResponse | null>`; `<CheckoutFlowSteps flow />` (renders step rows + blocked_products with links to existing resolution pages); Place Order disabled unless `flow == null || flow.ready_to_checkout`.

- [ ] **Step 1: Server action**:
```ts
"use server";
import { getStadianClient } from "@/lib/stadian";
import type { CheckoutFlowResponse } from "@stadian/storefront-sdk";
export async function getCheckoutFlow(sessionId: string, state: string): Promise<CheckoutFlowResponse | null> {
  try { return await getStadianClient().checkout.getFlow(sessionId, state); }
  catch { return null; }
}
```

- [ ] **Step 2: CheckoutFlowSteps component** — read `CheckoutFlowResponse.steps` (skip the `payment` step) and `blocked_products`. For each non-completed step render a row with the label + a link to the existing resolution surface (intake → `/account` or the product's intake page; age/disclaimer → the existing flow). For a plain disclaimer-acceptance step render a checkbox the buyer can tick. List blocked products with their reason. (Lightweight per spec — do not build new Persona/intake widgets.)

- [ ] **Step 3: Wire into page.tsx** — when the shipping `state` field changes (or on a "check eligibility" action), call `getCheckoutFlow(sessionId, state)` into `flow` state; render `<CheckoutFlowSteps flow={flow} />` above Payment; disable the Place Order button when `flow && !flow.ready_to_checkout`. In `handleSubmit`'s catch, detect a backend 422 (the SDK throws with a message/status) and show its message instead of the generic text.

- [ ] **Step 4: Verify** `npm run typecheck` + `npm run build` clean.

- [ ] **Step 5: Commit**
```bash
git add src/app/actions/checkout-flow.ts src/components/checkout/checkout-flow-steps.tsx src/app/checkout/page.tsx
git commit -m "feat(checkout): gate place-order behind checkout/flow compliance + surface 422 blocks"
```

---

## Task 12: E2e up-to-submit checkout spec

**Files:**
- Create: `e2e/checkout.spec.ts`

**Interfaces:**
- Consumes: the live API (read-only flows only — NEVER click Place Order).

- [ ] **Step 1: Write the spec** (mirror `smoke.spec.ts` harness). Cover, without submitting:
  1. Navigate from a product → add to cart → `/checkout`; assert the form renders (Contact, Shipping Address, Shipping Method, Payment).
  2. Fill the Base UI state + country selects; assert their hidden inputs carry values (`[name="state"]` value non-empty).
  3. Assert shipping options render (at least one radio, or an auto-selected single option).
  4. Toggle "same as shipping" off in the Payment/billing section; assert the billing fields appear.
  5. Assert the "Place Order" button exists and is enabled only when the form is fillable (and disabled while the payment form shows "loading", if reachable).
  Do NOT click Place Order.

- [ ] **Step 2: Run** `npm test` (Playwright) — new spec + smoke + closed all green. If a step needs live state that isn't deterministic (e.g. a configured shipping method on the test tenant), guard it with a conditional skip + a `console.warn` noting what was skipped (no silent omission).

- [ ] **Step 3: Commit**
```bash
git add e2e/checkout.spec.ts
git commit -m "test(e2e): checkout up-to-submit (form, selects, shipping, billing toggle) — no real order"
```

---

## Task 13: Full gate + Vercel PREVIEW deploy

**Files:** none (CI/deploy)

- [ ] **Step 1: Run all gates** from repo root: `npm run lint` (0 errors), `npm run typecheck` (0 errors), `npm run test:unit`, `npm test` (Playwright), `npm run build`. All green.
- [ ] **Step 2: Secret scan** `gitleaks detect --source . --no-banner` (clean; `.gitleaksignore` already covers the known docs placeholder).
- [ ] **Step 3: Deploy a PREVIEW (not production).** `vercel` (preview) or `vercel deploy` without `--prod`. Capture the preview URL.
- [ ] **Step 4: Report the preview URL** to the user for manual review + a manual test order via a manual payment method (no card charge), which the admin then cancels. Do NOT promote to production until the user approves.

---

## Self-Review

**Spec coverage:**
- Phase 1: billing via ref → Task 3,6 ✓; payment failure → Task 2,6 ✓; submit guard → Task 4 ✓; inline guest confirmation → Task 5,6 ✓.
- Phase 2: SDK params + order type → Task 7 ✓; SDK shipping estimate → Task 8 ✓; auth token → Task 10 ✓; shipping selection + cost → Task 9 ✓.
- Phase 3: flow gating + 422 → Task 11 ✓.
- Testing: vitest infra → Task 1 ✓; pure-logic unit tests → Task 2 ✓; e2e up-to-submit → Task 12 ✓; preview + manual order → Task 13 ✓.
- SDK version bump/cache-bust → Tasks 7,8 ✓ (global constraint).

**Placeholder scan:** backend untouched; all SDK/storefront tasks carry concrete code. UI component internals (ShippingMethods radios, CheckoutFlowSteps rows) describe exact props/data + reference existing styling rather than fabricating full markup, because they must match unseen local UI conventions — each lists files, props, data source, and a concrete verify. The `state`-change trigger for the flow call (Task 11) is a named integration point, not a vague step.

**Type consistency:** `Address`, `CheckoutResult`, `BuildPayloadInput`, `PaymentSectionHandle.getBillingState`, `ShippingOption`/`ShippingEstimateResponse`, `CheckoutFlowResponse`, `ConfirmedOrder`, `createOrder` `data.shippingMethodId`, SDK `customerToken`/`shippingMethodId` — referenced consistently across tasks. SDK version increments 1.0.1 → 1.0.2 (Task 7) → 1.0.3 (Task 8).

# Production Checkout — Design

**Date:** 2026-06-26
**Status:** Approved (design), pending implementation plan
**Repos:** `stadian-storefront` (Next.js + vendored `@stadian/storefront-sdk`). **No backend changes** (`peptide-platform`) for v1.

## Problem

The storefront checkout (`src/app/checkout/page.tsx`) collects contact, shipping, payment, and notes and creates an order, but a review found significant gaps that make it not production-complete. Critically, the backend already implements almost everything needed — the storefront simply doesn't call the relevant endpoints. This spec wires the storefront (and the vendored SDK) to the existing backend so checkout works correctly for guest **and** authenticated buyers, handles payment failures, computes shipping, and gates regulated products.

The recent `finish/checkout-address` work (address dropdowns, error handling, corrected payment paths, unpriced-product UX) is the starting point and stays.

## Backend reality (grounding — all EXISTS today)

- `POST /checkout` (`storefront/v1/checkout.py`): guest (via `customer_email`) or authenticated (via `Authorization: Bearer` → `get_storefront_customer`). Request accepts `shipping_method_id`; recomputes `shipping_amount` server-side (anti-manipulation). Response `StorefrontOrder` already returns `order_number`, `status`, `subtotal/discount/tax/shipping/total`, **`payment_status`** (`pending|success|failed`), **`payment_error`**, **`redirect_url`**, and `warnings`.
- `POST /shipping-estimate` (`storefront/v1/shipping.py`): API-key only; takes `session_token`, returns `options: [{method_id, method_name, price, is_free}]`.
- `POST /checkout/flow` (`storefront/v1/checkout_flow.py`): takes `session_token` + `shipping_state`; returns ordered `steps` (shipping_check, disclaimer, age_verification, intake, payment), `ready_to_checkout: bool`, `blocked_products`.
- `GET /orders/{id}`: **requires auth** (`require_storefront_customer`) — no guest lookup. (Avoided via inline confirmation; see below.)

## Non-goals (v1)

- No backend changes. (Guest order *re-lookup* endpoint, method-level state shipping restrictions, address validation, zone-based rates, ACH vaulting, PayByLink webhook settlement — all out of scope; tracked as future work.)
- No "claim session cart on login" endpoint. Authenticated checkout relies on sending the Bearer token so the backend resolves the customer from the JWT (it prefers the authenticated customer over `cart.user_id`).

## Architecture

Three independently-shippable phases, in dependency order. Each is preview-deployable.

### Phase 1 — Storefront-only correctness fixes (no SDK/backend)

1. **Billing "same as shipping" actually works.** Verified: `BillingAddress` renders **inside `PaymentSection`** (three call sites, one per payment mode), with `sameAsShipping` as controlled React state (`useState(true)`) and **no `name`** on the checkbox. `checkout/page.tsx` reads `data.get("billing_same")` from `FormData` — always `null` (controlled checkbox, no name) — and its logic `=== "on" || === null` is inverted (an unchecked box → `null` → wrongly treated as "same as shipping"). So an entered billing address is silently dropped. **Fix (cleanest): read billing from the `PaymentSection` ref, not `FormData`.** `PaymentSection` already exposes a ref handle (`getPaymentData()`); extend it (or its handle) to return `{ sameAsShipping, billingAddress }`, and have `checkout/page.tsx` use that instead of the `billing_same`/`FormData` path. This sidesteps the no-`name`/three-render problem and matches how payment data is already read. Remove the broken `FormData` billing logic.
2. **Surface payment failure.** After `createOrder`, if `order.payment_status === "failed"`, show `order.payment_error` (or a generic message) and do **not** navigate to the confirmation as if successful. Only treat `redirect_url` (redirect flow) and `payment_status !== "failed"` as success paths.
3. **Guard submit until payment is ready.** In `PaymentSection.getPaymentData()`, throw if embedded mode and the payment form isn't `formReady` (prevents placing an order with no payment token). Disable "Place Order" when the payment form isn't ready in embedded mode.
4. **Inline guest order confirmation.** After a successful order, instead of always `router.push('/account/orders/{id}')` (which 404s for guests via `notFound()`), render an **inline confirmation** from the checkout response data (order number, status, total, email). Authenticated users may still link to `/account/orders/{id}`; guests get the inline confirmation. Implementation: a confirmation view that takes the returned `StorefrontOrder` (passed via client state / a confirmation route that receives the order through context, not a re-fetch).

### Phase 2 — SDK + shipping + authenticated identity

5. **Vendored SDK additions** (`vendor/storefront-sdk`): add optional `customerToken?: string` and `shippingMethodId?: string` to `checkout.create` params; when `customerToken` is set, send `Authorization: Bearer <token>`. Add a `shipping.estimate(sessionToken)` method (or generic call) returning the options. Extend the `StorefrontOrder` type with `payment_status?`, `payment_error?`, `redirect_url?`, `shipping_amount?` (removing the current `as unknown as` casts). **Bump the SDK version** (and lock node) so Vercel's cache picks up the change (per the earlier stale-cache lesson).
6. **Authenticated checkout sends the token.** `createOrder` (server action) reads `getCustomerToken()`; if present, passes `customerToken` to `checkout.create`. Logged-in buyers' orders attach to their account.
7. **Shipping method selection + cost.** `POST /shipping-estimate` takes **only `session_token`** (weight-based, address-independent), so the selector loads immediately on checkout mount — **not** gated on the address. Call `shipping.estimate(sessionId)`, render the returned options (radio list with prices / "Free"), default to the cheapest/first. Pass the chosen `shippingMethodId` to `createOrder` → `checkout.create` (the backend re-validates and recomputes the price). Show the selected shipping cost as a line in `OrderSummary` and the confirmation total. Handle empty-options (no shipping configured → proceed; backend allows `shipping_method_id=None`) and single-option (auto-select, no radio) cases.

### Phase 3 — Compliance / regulated-product gating

8. **Checkout flow gating (lightweight for v1).** Once the shipping `state` is entered, call `POST /checkout/flow` via a new SDK method. **Scope for v1: gate, don't rebuild.** Render each returned non-payment `step` as a status row (label + completed/required indicator) and list `blocked_products` with their reason; for unresolved steps, link to the **existing** resolution surface (intake form page, account/age-verification) rather than building new inline disclaimer/age/intake widgets. The exception is a simple disclaimer **checkbox** where the step is a plain acceptance (no external flow). Gate the "Place Order" button behind `ready_to_checkout === true`. Also surface backend `422` validation errors from `/checkout` with their block message instead of a generic "try again". (Full inline compliance widgets — Persona age flow, embedded intake — are explicitly deferred.)

## Components & data flow

- `checkout/page.tsx` orchestrates: loads `getPaymentConfig`/stored methods (existing) + **`getCheckoutFlow`** (new) + **`getShippingOptions`** (new, after address). Submit builds the order payload incl. `shippingMethodId` + `customerToken`, calls `createOrder`, then branches: redirect → `redirect_url`; failed → inline error; success → inline confirmation (guest) or account order (auth).
- New small components: `ShippingMethods` (radio list from estimate), `CheckoutFlowSteps` (renders/gates compliance steps), `OrderConfirmation` (inline, from the returned order). Keep each focused and independently testable.
- `OrderSummary` gains a shipping line (driven by the selected option's price).
- Server actions: extend `checkout.ts` (`createOrder` adds `customerToken`, `shippingMethodId`); add `shipping.ts` (`getShippingOptions`) and `checkout-flow.ts` (`getCheckoutFlow`) thin server actions wrapping the SDK.

## Error handling

- Payment failure → inline error + keep the user on checkout with their cart (do not `clearSession()` until a non-failed result). Re-evaluate where `clearSession()` is called so a failed payment doesn't strand the buyer.
- `/checkout` `422` (compliance) → parse and show the block message + resolution.
- Shipping estimate failure → show methods unavailable, allow proceeding only if backend allows (it validates `shipping_method_id`); never hard-crash.
- All new SDK calls wrapped so a transient API hiccup degrades gracefully (matches existing `try/catch` patterns).

## Testing

Constraints (verified): the repo has **only Playwright e2e** (no component runner), `createOrder` is a **Next.js server action** (server-to-server — Playwright cannot intercept it to mock responses), and the storefront reads the **live tenant** (a real order-placing e2e would create a real order). The strategy works within these:

1. **Unit tests (introduce `vitest`):** extract the risky submit logic out of the `handleSubmit` closure into pure, testable functions and cover them without a backend:
   - `buildOrderPayload(...)` → asserts the payload carries `state`/`country`, `billing_*` only when billing differs, `shipping_method_id`, and `customerToken` when authenticated.
   - `resolveCheckoutResult(order, paymentData)` → maps a `StorefrontOrder` to `{ kind: "redirect" | "failed" | "success", ... }`, covering: `payment_status === "failed"` → failed (with `payment_error`); `redirect_url` present → redirect; otherwise success. This is where the payment-failure and redirect correctness lives.
   - Add a `vitest` config + `"test:unit"` script; wire `test:unit` into the gate. (Playwright stays as `npm test`.)
2. **Playwright e2e (up-to-submit only; no real order):** add to the default suite — checkout renders; Base UI state/country selects populate; shipping options render and are selectable; billing toggle reveals/hides fields; compliance gating disables "Place Order" when `ready_to_checkout` is false (drive via a step the harness can reach, or skip if it needs live compliance state). **Do not click "Place Order" against the live API.**
3. **Manual verification on preview (real order, then cancel):** because preview hits the live tenant, the one true end-to-end check is a **test order via a manual payment method** (e.g. Venmo/Zelle — creates a `pending_payment` order, no card charge) on the preview build, which the admin then cancels. This is the user's click-through step.
- `tsc`, `eslint`, `next build`, `vitest`, and the up-to-submit Playwright specs all green before preview deploy.

## Rollout

Build all three phases on `finish/checkout-address`, gate (lint / tsc / `next build` / vitest / up-to-submit Playwright). **Vercel PREVIEW deploy** (not production). On the preview, the user does a manual end-to-end test order via a manual payment method (no card charge), then the admin cancels it — confirming the real happy path against the live tenant without a real charge. Promote to production only on that approval. The vendored-SDK version bump + lockfile update are included so the preview/prod build picks up the SDK changes (per the earlier stale-cache lesson).

## Open questions

None blocking. Future (separate spec): guest order re-lookup endpoint, PayByLink webhook settlement, address validation, zone-based shipping, ACH vaulting.

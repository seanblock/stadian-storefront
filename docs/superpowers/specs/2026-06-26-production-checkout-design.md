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

1. **Billing "same as shipping" actually works.** `billing-address.tsx`'s checkbox has no `name`, so `checkout/page.tsx` reads `billing_same` as `null` → always treats billing = shipping, silently ignoring an entered billing address. Fix: give the checkbox `name="billing_same"` + `value="on"` (and confirm the `BillingAddress` component is actually rendered in the checkout form — currently `PaymentSection` owns the `sameAsShipping` state; the billing fields must be inside the same `<form>` so `FormData` captures them). Net: when "same as shipping" is unchecked, the entered billing address is submitted.
2. **Surface payment failure.** After `createOrder`, if `order.payment_status === "failed"`, show `order.payment_error` (or a generic message) and do **not** navigate to the confirmation as if successful. Only treat `redirect_url` (redirect flow) and `payment_status !== "failed"` as success paths.
3. **Guard submit until payment is ready.** In `PaymentSection.getPaymentData()`, throw if embedded mode and the payment form isn't `formReady` (prevents placing an order with no payment token). Disable "Place Order" when the payment form isn't ready in embedded mode.
4. **Inline guest order confirmation.** After a successful order, instead of always `router.push('/account/orders/{id}')` (which 404s for guests via `notFound()`), render an **inline confirmation** from the checkout response data (order number, status, total, email). Authenticated users may still link to `/account/orders/{id}`; guests get the inline confirmation. Implementation: a confirmation view that takes the returned `StorefrontOrder` (passed via client state / a confirmation route that receives the order through context, not a re-fetch).

### Phase 2 — SDK + shipping + authenticated identity

5. **Vendored SDK additions** (`vendor/storefront-sdk`): add optional `customerToken?: string` and `shippingMethodId?: string` to `checkout.create` params; when `customerToken` is set, send `Authorization: Bearer <token>`. Add a `shipping.estimate(sessionToken)` method (or generic call) returning the options. Extend the `StorefrontOrder` type with `payment_status?`, `payment_error?`, `redirect_url?`, `shipping_amount?` (removing the current `as unknown as` casts). **Bump the SDK version** (and lock node) so Vercel's cache picks up the change (per the earlier stale-cache lesson).
6. **Authenticated checkout sends the token.** `createOrder` (server action) reads `getCustomerToken()`; if present, passes `customerToken` to `checkout.create`. Logged-in buyers' orders attach to their account.
7. **Shipping method selection + cost.** After a valid shipping address (state) is entered, call `shipping.estimate(sessionId)` and render the returned options (radio list with prices / "Free"). Pass the chosen `shippingMethodId` to `createOrder` → `checkout.create`. Show the selected shipping cost as a line in `OrderSummary` and the post-order confirmation total. Handle the empty-options / single-option cases gracefully.

### Phase 3 — Compliance / regulated-product gating

8. **Checkout flow gating.** On the checkout page (after shipping state known), call `POST /checkout/flow` via a new SDK method. Render the returned `steps` the buyer must resolve — disclaimer acceptance (checkbox), age verification (link/Persona), intake (link to the intake form) — and list `blocked_products`. Gate the "Place Order" button behind `ready_to_checkout === true`. Surface backend `422` validation errors (from `/checkout`) with their block detail rather than a generic "try again".

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

- Playwright e2e (the repo's harness), added to the default suite:
  - **Guest happy path:** add to cart → checkout → fill address (incl. Base UI state/country selects) → select shipping → place order (manual/redirect method) → inline confirmation shows order number. Intercept the `/checkout` request to assert payload carries `shipping_method_id`, `state`, `country`, and (for redirect) handle `redirect_url` without leaving the test domain.
  - **Payment failure:** mock a `payment_status: "failed"` response → assert the error is shown and no false "order placed".
  - **Billing differs:** uncheck "same as shipping", fill billing → assert `billing_*` fields are in the submitted payload.
  - **Compliance block:** mock `/checkout/flow` with `ready_to_checkout: false` → assert "Place Order" is gated.
  - Keep `test:closed` and `smoke` green; new tests run with the live API where safe, mocked where it would create real orders (never place a real order against the live tenant in CI).
- `tsc`, `eslint`, `next build` clean; preview deploy for manual click-through before production.

## Rollout

Build all three phases on `finish/checkout-address`, gate (lint/tsc/build/e2e), **Vercel PREVIEW deploy** (not production) for user review, then promote to production on approval. SDK version bump + lockfile update included so the preview/prod build picks up SDK changes.

## Open questions

None blocking. Future (separate spec): guest order re-lookup endpoint, PayByLink webhook settlement, address validation, zone-based shipping, ACH vaulting.

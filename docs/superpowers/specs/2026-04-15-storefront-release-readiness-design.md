# Stadian Storefront — Release Readiness Design

**Date:** 2026-04-15
**Goal:** Make the stadian-storefront a production-ready, distributable reference storefront that tenants can clone, configure with their API key, and deploy to any Next.js-compatible host.

**Context:** The storefront is a public, open-source Next.js app that connects to the Stadian platform via the `@stadian/storefront-sdk`. Tenants host it themselves — Vercel, Netlify, self-hosted, wherever. Stadian does not handle tenant payments directly; tenants bring their own high-risk merchant processor (NMI or Authorize.net), configured in their Stadian dashboard. Email is handled server-side by the Stadian platform's Resend plugin — the storefront does not send emails.

**SDK:** Published to npm as `@stadian/storefront-sdk` (public, free). Source stays in the `peptide-platform` monorepo at `packages/storefront-sdk/`.

---

## Workstream 1: Security & Config

### 1a. Security Headers

Add security headers to `next.config.ts` via the `headers()` config:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://secure.networkmerchants.com https://jstest.authorize.net https://js.authorize.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:; frame-src 'self' https://secure.networkmerchants.com https://jstest.authorize.net https://js.authorize.net;` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

CSP allows NMI (Collect.js) and Authorize.net (Accept.js) script sources since tenants may use either gateway. `'unsafe-eval'` is required by some payment gateway JS — tenants not using embedded payment forms can remove it. Tenants can adjust CSP for their needs.

### 1b. Webhook Fail-Closed

In `src/app/api/webhooks/stadian/route.ts`, change the signature verification logic:

- If `STADIAN_WEBHOOK_SECRET` is not set, return `500` with body `{ error: "Webhook secret not configured" }` and log a warning
- Never skip verification — fail closed

### 1c. Image Restrictions

In `next.config.ts`:

- Remove `hostname: "**"` wildcard
- Replace with a pattern that allows images from the configured `STADIAN_API_URL` host
- Gate `dangerouslyAllowLocalIP: true` behind `process.env.NODE_ENV === 'development'`

### 1d. Tiptap href Sanitization

In `src/components/tiptap-renderer.tsx`:

- Before rendering `<a href={...}>`, validate the protocol
- Only allow `http:`, `https:`, and `mailto:` — strip or ignore `javascript:` and other protocols

### 1e. Server-Side Route Protection Middleware

Create `src/middleware.ts`:

- Check for the customer auth cookie on protected paths: `/account/:path*`, `/intake/:path*`
- If no cookie, redirect to `/login?redirect={originalPath}` so the user returns after auth
- Allow all other paths through

### 1f. IDOR Protection on Order/Intake Status

- Move `/order/[id]` to `/account/orders/[id]` so middleware protects it
- Move `/intake/status/[id]` to `/account/intake/[id]` so middleware protects it
- Both pages already fetch data with the customer token — middleware adds the server-side gate
- Update all internal links and redirects to use the new paths (checkout success redirect, intake form submission redirect)

---

## Workstream 2: Payment Integration

### 2a. Gateway Config on Checkout

When the checkout page loads:

- Call `payments.getClientConfig()` via a server action
- Returns: `{ gateway_type, tokenization_key, checkout_mode, ach_enabled }` or `null` if no gateway configured
- Pass config to the client component

### 2b. Mount PaymentForm (Embedded Mode)

If `checkout_mode === "embedded"` and config is present:

- Use the SDK's `PaymentForm` helper
- Call `PaymentForm.mount(containerElement, config)` to load the gateway's JS and render secure card fields
- Render card fields: number, expiry, CVV
- If `ach_enabled`, render ACH fields: account number, routing number, account type
- Add a radio toggle for "Card" vs "Bank Account" if ACH is enabled

### 2c. Redirect Flow

If `checkout_mode === "redirect"`:

- Show a message explaining the customer will be redirected to complete payment
- On "Place Order", create the order with `paymentFlow: "redirect"`
- The API returns a redirect URL — send the customer there
- On return, the order confirmation page shows the payment status

### 2d. No Gateway Fallback

If `getClientConfig()` returns `null`:

- Show a message: "This store accepts manual payment. You'll receive payment instructions after placing your order."
- Create order with `paymentMethod: "pending"` (current behavior)

### 2e. Tokenize Before Submission

On "Place Order" click (embedded mode):

1. Call `PaymentForm.tokenize()` — returns `{ token, paymentType }`
2. Call `checkout.create()` with `paymentToken: token`, `paymentType`, `paymentFlow: "embedded"`
3. Show loading state during tokenization + order creation
4. On success, redirect to order confirmation

### 2f. Stored Payment Methods

For authenticated customers:

- On checkout, call `payments.getStoredMethods()` to fetch saved cards
- If saved methods exist, show them as selectable options above the new card form
- Add a "Save this card for future orders" checkbox
- Pass `storedPaymentMethodId` when using a saved card, or `savePaymentMethod: true` when saving a new one
- Add a "Payment Methods" section to `/account/settings` showing saved cards with delete buttons via `payments.deleteStoredMethod()`

### 2g. Billing Address

- Add billing address fields to checkout
- Default: "Same as shipping" checkbox (checked by default)
- When unchecked, show separate billing address fields
- Pass billing address to `checkout.create()`

### 2h. Error Handling

- Tokenization errors: show inline message below payment fields ("Card declined", "Invalid card number", etc.)
- Map common decline codes to user-friendly messages
- Network errors: show retry option
- Never expose raw gateway error strings to the customer

---

## Workstream 3: Missing Features

### 3a. Order History

- Wire `/account/orders` to fetch real orders
- Check SDK for `orders.list()` — if missing, add it to the SDK
- Display: order number, date, status badge, item count, total
- Each row links to `/account/orders/[id]` (new path from 1f)
- Pagination if the API supports it

### 3b. Profile Editing

- Replace "contact support" on `/account/settings` with an edit form
- Fields: first name, last name, phone
- Email display-only (changing email requires verification flow)
- Add "Change Password" section: current password, new password, confirm
- Check SDK for `customers.update()` and `customers.changePassword()` — add if missing

### 3c. Token Refresh

- Store the refresh token from login response in a separate httpOnly cookie
- When any server action gets a 401 from the API, attempt `customers.refreshToken()` with the refresh token
- If refresh succeeds, update the auth cookie and retry the original request
- If refresh fails, clear both cookies and redirect to login
- This extends sessions beyond 7 days without requiring re-login

### 3d. Feature Gating (API-Driven)

- Fetch tenant capabilities from the API — ideally a `/v1/storefront/config` endpoint that returns `{ features: { intake: true, affiliates: false, reviews: true } }`
- If this endpoint doesn't exist yet in the backend, stub it — return all features enabled, with a TODO for the backend
- Use the config to:
  - Show/hide "Intake" nav links and routes
  - Show/hide "Affiliate" dashboard and nav items
  - Show/hide reviews on product pages
  - Show/hide discount code input
- Cache the config (revalidate on webhook or time-based)

### 3e. Discount Code UI

- Add a promo code input to the cart page (collapsible "Have a promo code?" section)
- On apply, call the SDK to validate the code against the cart
- If valid, show the discount in the order summary
- Pass the promo code through to `checkout.create()`
- Check SDK for a discount validation method — add if missing

### 3f. Referral Tracking

- On any page load, check for `?ref=CODE` in the URL query params
- If present, store the affiliate code in an httpOnly cookie (30-day expiry) — server actions read it via `cookies()`
- On `checkout.create()`, include the affiliate code if one is stored
- Clear the cookie after successful order placement
- Show a subtle banner: "Referred by [affiliate name]" if applicable (optional, nice-to-have)

### 3g. Mobile Navigation

- Add a hamburger menu button (visible on small screens, hidden on desktop)
- Opens a slide-out or dropdown with all nav links: Products, About, FAQ, Account, Cart
- Close on navigation or outside click
- Use the existing Sheet component from shadcn/ui

---

## Workstream 4: Email & Content Cleanup

### 4a. Remove Resend from Storefront

- Delete `src/lib/email.ts`
- Delete `src/lib/email-templates.ts`
- Remove `resend` from `package.json` dependencies
- The Stadian platform's Resend plugin sends all transactional emails server-side — the storefront never sends email

### 4b. Simplify Webhook Handler

In `src/app/api/webhooks/stadian/route.ts`:

- Keep: signature verification (now fail-closed per 1b), JSON parsing, event type routing
- Keep: `revalidatePath()` / `revalidateTag()` calls for cache busting on product/order/content changes
- Remove: all `sendEmail()` calls and email-related imports
- The backend sends emails when events occur — the webhook handler only refreshes the Next.js cache

### 4c. Content Fetching via SDK

- `src/lib/content.ts` currently makes direct `fetch()` calls to `/v1/storefront/pages/{slug}` and `/v1/storefront/faq`
- Replace with SDK methods: `pages.about()`, `pages.terms()`, `pages.privacy()`, `pages.returns()`, `pages.faq()`
- Delete `src/lib/content.ts` after migration
- Update all page components that import from `content.ts` to use server actions calling the SDK

---

## Workstream 5: SDK & Distribution

### 5a. SDK npm Publish Prep

In `peptide-platform/packages/storefront-sdk/package.json`:

- Set `"name": "@stadian/storefront-sdk"`
- Set `"version": "1.0.0"`
- Set `"private": false`
- Add `"description"`, `"license"` (MIT or similar), `"repository"`, `"keywords"`
- Add `"publishConfig": { "access": "public" }`
- Verify `"main"`, `"module"`, `"types"`, and `"exports"` map point to built output
- Verify build script produces ESM + CJS + `.d.ts` type declarations
- Add `"files"` array to include only the dist output (not source, tests, etc.)
- Add or verify `.npmignore` or `files` field excludes dev files

### 5b. Update Storefront Dependency

In `stadian-storefront/package.json`:

- Change `"@stadian/storefront-sdk": "file:../peptide-platform/packages/storefront-sdk"` to `"@stadian/storefront-sdk": "^1.0.0"`
- Run `npm install` and verify the build passes
- Note: during local dev, can use `npm link` to test against local SDK changes

### 5c. Complete `.env.local.example`

```env
# Your Stadian API key — create one in the CRM dashboard under Settings > API Keys
STADIAN_API_KEY=sk_live_your_api_key_here

# Stadian API base URL
STADIAN_API_URL=https://api.your-stadian-instance.com

# Webhook secret for verifying incoming webhooks from Stadian (required)
STADIAN_WEBHOOK_SECRET=your_webhook_secret_here

# Your storefront's public URL (used for SEO, OG tags, sitemap)
NEXT_PUBLIC_SITE_URL=https://your-store.com
```

### 5d. Update README

Structure:
1. **Header** — name, one-line description, badges (npm version, license)
2. **Quick Start** — clone, env setup, install, dev (4 steps)
3. **Deploy** — Vercel deploy button + manual deploy instructions
4. **Environment Variables** — table with all vars, required/optional, descriptions
5. **Features** — list of what's included (product catalog, cart, checkout with payment processing, auth, intake forms, affiliate program, SEO, etc.)
6. **Pages** — complete route table including account, auth, intake, affiliate
7. **Customization** — theming (CSS vars, shadcn), branding (API-driven), code modification
8. **Tech Stack** — Next.js 16, shadcn/ui, Tailwind, @stadian/storefront-sdk
9. **SDK** — link to npm package, mention it can be used independently for custom builds

### 5e. Publish Config

- Add `"publishConfig": { "access": "public" }` to SDK's `package.json`
- Claim `@stadian` npm scope (requires npm account setup)
- The actual `npm publish` is a manual step Sean runs — we just make sure the package is ready

---

## Dependencies Between Workstreams

| Workstream | Depends On | Notes |
|-----------|-----------|-------|
| 1. Security | None | Fully independent |
| 2. Payments | None | Code is ready; end-to-end testing needs backend plugin deployed |
| 3. Features | None | Some SDK methods may need to be added |
| 4. Email/Content | None | Fully independent |
| 5. SDK/Dist | None | SDK publish is independent; storefront dependency update is last step |

All 5 workstreams can run in parallel. The only sequencing constraint is that workstream 5b (updating the storefront's SDK dependency to npm) should happen after 5a (SDK is publish-ready) and after all other workstreams that might modify SDK usage (2, 3, 4c).

---

## Out of Scope

- Backend changes to the CRM API (payment gateway deployment, new endpoints) — separate effort
- Actual `npm publish` command — manual step after code is ready
- Payment end-to-end testing — requires backend payment gateway plugin to be running
- Mobile app or non-Next.js storefronts
- Multi-language / i18n support
- Wishlist / favorites feature
- Customer review submission (display-only for now)
- Admin/CRM dashboard changes

## SDK Methods That May Need Adding

During implementation, if any of these SDK methods don't exist, they need to be added to `packages/storefront-sdk/`:

- `orders.list()` — for order history (3a)
- `customers.update()` — for profile editing (3b)
- `customers.changePassword()` — for password change (3b)
- `config.get()` or `store.getConfig()` — for feature gating (3d)
- `cart.applyDiscount()` — for promo codes (3e)

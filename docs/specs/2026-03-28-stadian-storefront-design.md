# Stadian Storefront — Design Spec

**Date:** 2026-03-28
**Status:** Draft

---

## Overview

A standalone Next.js template repository (`stadian-storefront`) that tenants fork, configure with a single API key, and deploy on their own domain. All product data, orders, customer accounts, and affiliate tracking flow through the Stadian platform via the existing storefront SDK (`@stadian/storefront-sdk`). Tenants own the code, hosting, payments, and customer communication. The Stadian platform tracks state and fires webhooks.

### Goals

- Any tenant can have a working store by cloning the repo and adding an API key
- Non-technical tenants can customize branding from the CRM dashboard
- Technical tenants can modify the Next.js app however they want
- Stadian has zero involvement in hosting, payments, or customer emails

### Non-Goals

- Stadian does not host the storefront
- Stadian does not process payments
- Stadian does not send customer-facing emails
- No theme marketplace or multiple templates for v1

---

## Architecture

### Separation of Concerns

| Responsibility | Owner |
|---------------|-------|
| Product catalog, orders, customers, affiliates, intake | Stadian platform (CRM API) |
| Storefront UI, hosting, deployment | Tenant |
| Payment processing | Tenant (their own provider) |
| Transactional emails | Tenant (Resend pre-wired in template) |
| Branding/customization | Tenant (code) or CRM dashboard (API fallback) |

### Repo

- **Name:** `stadian-storefront`
- **Separate GitHub repo** — not in the `peptide-platform` monorepo
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Data layer:** `@stadian/storefront-sdk`
- **Emails:** Resend (pre-wired, tenant provides API key)
- **Payments:** No provider by default; example integrations provided

### Setup Flow

1. Tenant clones the repo (or uses `create-next-app --example`)
2. Sets `STADIAN_API_KEY` in `.env.local`
3. Optionally sets `RESEND_API_KEY` for transactional emails
4. `npm install && npm run dev` — working store
5. Customize Tailwind, components, pages as desired
6. Deploy to Vercel (or anywhere) on their own domain

---

## Page Structure

```
app/
├── (shop)/
│   ├── page.tsx                    # Homepage — featured products, hero
│   ├── products/
│   │   ├── page.tsx                # Catalog — grid, search, category filter
│   │   └── [slug]/page.tsx         # Product detail — images, description, add to cart
│   ├── cart/page.tsx               # Cart — line items, quantities, discount code
│   ├── checkout/page.tsx           # Checkout — shipping, payment, order summary
│   └── order/[id]/page.tsx         # Order confirmation / status
│
├── (account)/
│   ├── login/page.tsx              # Customer login
│   ├── register/page.tsx           # Customer registration
│   ├── forgot-password/page.tsx    # Password reset request
│   ├── reset-password/page.tsx     # Password reset form
│   ├── verify-email/page.tsx       # Email verification
│   ├── account/
│   │   ├── page.tsx                # Account overview
│   │   ├── orders/page.tsx         # Order history
│   │   └── settings/page.tsx       # Profile, addresses
│   └── intake/
│       ├── [productId]/page.tsx    # Fill out intake form
│       └── status/page.tsx         # Track intake submissions
│
├── (affiliate)/
│   ├── affiliate/
│   │   ├── page.tsx                # Dashboard — commissions, stats, referral link
│   │   └── payouts/page.tsx        # Payout history
│
├── (content)/
│   ├── about/page.tsx
│   ├── faq/page.tsx
│   ├── terms/page.tsx
│   ├── privacy/page.tsx
│   └── returns/page.tsx
│
├── api/
│   └── webhooks/
│       └── stadian/route.ts        # Receives webhooks, triggers revalidation + emails
│
└── layout.tsx                      # Root layout — header, footer, cart/auth providers
```

### Route Groups

- `(shop)` — public, no auth required
- `(account)` — requires customer login (except login/register/forgot-password)
- `(affiliate)` — requires customer login + affiliate fields present on profile
- `(content)` — public static pages

---

## SDK Integration & Data Flow

### SDK Setup (`/lib/stadian.ts`)

Single SDK client initialized with the tenant's API key from environment variables. Used by both Server Components and client-side providers.

### Data Fetching Strategy

| Page Type | Method | Reason |
|-----------|--------|--------|
| Product catalog/detail | SSG with ISR | SEO, performance; revalidated via webhook |
| Homepage | SSG with ISR | Same as above |
| Cart | Client-side | Session-based, real-time updates |
| Checkout | Client + Server Action | Collect info client-side, create order server-side |
| Account/affiliate pages | SSR | Auth required, always fresh |
| Content pages | Static | Tenant edits directly |

### Client-Side Providers

- **CartProvider** — manages cart state via `X-Session-ID`, persisted in localStorage
- **AuthProvider** — manages customer JWT (httpOnly cookie), login/logout, profile

### Webhook Receiver

`/api/webhooks/stadian` receives events from the platform:
- `order.confirmed`, `order.shipped`, `order.cancelled` → send email to customer, revalidate order page
- `intake.approved`, `intake.denied`, `intake.info_requested` → send email to customer
- `product.updated`, `product.created`, `product.deleted` → trigger ISR revalidation of catalog/product pages

---

## Checkout & Payments

### Default: No Payment Provider

The template ships without a payment provider configured. Checkout creates the order in the platform with `payment_status: "pending"` and displays the tenant's payment instructions.

**Default flow:**
1. Customer fills cart, proceeds to checkout
2. Enters shipping address and contact info
3. Checkout confirmation page shows tenant-configured payment instructions (e.g., "Send Zelle to payments@acmepeptides.com")
4. Order created in platform as "payment pending"
5. Tenant confirms payment in CRM → order status updates → customer notified via webhook + email

### Payment Instructions

Tenants configure their payment instructions in the checkout page directly — it's just a React component they edit. Could include Zelle details, wire info, crypto addresses, or any text.

### Example Integrations

The template includes a `/examples/payments/` directory with drop-in examples for:
- **Stripe** — Stripe Elements integration
- **Square** — Square Web Payments SDK
- **Manual** — configurable instruction text (the default)

Tenants copy the example into their checkout page and configure as needed.

### Order + Payment Reference

When creating an order via `stadian.checkout.create()`, the storefront passes:
- Order items, shipping address, customer info
- `payment_method` — string describing how the customer is paying (e.g., "zelle", "stripe", "wire")
- `payment_reference` — optional external reference (e.g., Stripe payment intent ID)

---

## Customer Auth

### Flow

- Register/login via `stadian.customers.register()` / `stadian.customers.login()`
- JWT stored in httpOnly cookie (set via Next.js route handler)
- `AuthProvider` wraps the app, exposes `customer`, `isAuthenticated`, `login()`, `logout()`
- Protected routes redirect to `/login` if unauthenticated

### Features

- Email + password registration
- Email verification (via Resend)
- Forgot password / reset flow
- Profile management (name, email, phone, addresses)
- Order history

### Affiliate Customers

Affiliates are customers with affiliate fields populated on their user record. No separate role or login flow.

- `GET /storefront/v1/customers/me` returns affiliate fields when present (affiliate_code, commission_rate, referral link)
- Template conditionally shows affiliate nav items and pages based on profile
- Affiliate referral tracking: reads `?ref=CODE` from URL, stores in cookie, sends with checkout

---

## Theming & Customization

### For Dev Tenants

It's their Next.js app. They edit:
- `tailwind.config.ts` — colors, fonts, spacing, radius
- Components — swap header, footer, product cards, any UI
- `/public` — logo, favicon, OG images
- Pages — add, remove, or restructure routes

### For Non-Technical Tenants

The template fetches branding from the CRM dashboard on build:
- Store name, tagline, logo URL
- Primary color, accent color
- Social links, footer text

These values map to CSS variables consumed by Tailwind. Tenant updates branding in CRM → triggers redeploy (via webhook or manual) → store reflects changes.

Code-level customizations always win over API-fetched branding.

### Template Ships With

- Clean, modern default design
- Dark and light mode support
- Mobile responsive
- Product grid and list views
- Sensible defaults that look good with zero customization

---

## Product-Specific Behaviors

### Intake-Required Products

Products with intake forms show "Complete intake form" instead of "Add to cart." Flow:
1. Customer clicks → redirected to `/intake/[productId]`
2. Fills out the form (requires login)
3. Submission sent to platform for review
4. On approval → customer can purchase the product
5. Status tracked at `/intake/status`

### Age-Restricted Products

Products with `requires_age_verification` show a date-of-birth gate before adding to cart.

### Practitioner-Required Products

Products with `requires_practitioner` are hidden from the public storefront catalog by default. The catalog API filters them out.

### Discount Codes & Affiliate Tracking

- Discount code input on cart page — validated via SDK
- Affiliate referral: `?ref=CODE` in URL → cookie → sent with checkout automatically

---

## SEO & Performance

### Product Pages

- SSG with ISR — statically generated, revalidated via webhook when products change
- Dynamic `<meta>` tags from product data (`seo_title`, `seo_description`)
- Open Graph images from product images
- JSON-LD structured data (Product schema)
- Clean URLs via product slugs (`/products/bpc-157-10mg`)

### Site-Wide

- Auto-generated sitemap from product catalog
- `robots.txt` included
- Next.js Image component for product images
- Server Components by default — minimal client JS on catalog/product pages

---

## Transactional Emails

Handled by the storefront via Resend. Tenant provides `RESEND_API_KEY` in env.

### Email Templates (in repo, tenant customizable)

- **Order confirmation** — sent on checkout
- **Order shipped** — triggered by `order.shipped` webhook
- **Order cancelled** — triggered by `order.cancelled` webhook
- **Password reset** — sent on forgot-password request
- **Email verification** — sent on registration
- **Intake status update** — triggered by intake webhooks (approved, denied, info requested)

### Tenant Customization

Email templates are React components (using `@react-email/components` or similar). Tenant edits them directly — their repo, their emails.

---

## Platform Changes Required

### New Storefront API Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /storefront/v1/branding` | API key only | Tenant's storefront branding config |
| `GET /storefront/v1/customers/commissions` | Customer JWT | Commission history |
| `GET /storefront/v1/customers/payouts` | Customer JWT | Payout history |
| `POST /storefront/v1/customers/forgot-password` | API key only | Send password reset email token |
| `POST /storefront/v1/customers/reset-password` | API key only | Validate token, set new password |
| `POST /storefront/v1/customers/verify-email` | API key only | Validate email verification token |

### Modified Endpoints

| Endpoint | Change |
|----------|--------|
| `GET /storefront/v1/customers/me` | Include affiliate fields in response (affiliate_code, commission_rate, referral link, affiliate_status) |
| `POST /storefront/v1/checkout` | Add `payment_method` and `payment_reference` fields to request schema (Order model already supports these) |

### CRM Dashboard Additions

- **Storefront Branding** settings page in tenant settings — writes to `tenant.branding` dict
  - Store name, tagline
  - Logo URL
  - Primary color, accent color, light/dark mode
  - Social links
  - Footer text

### Storefront SDK Updates

- Add `branding.get()` method
- Add `customers.commissions()` method
- Add `customers.payouts()` method
- Add `customers.forgotPassword()` method
- Add `customers.resetPassword()` method
- Add `customers.verifyEmail()` method
- Include affiliate fields in customer profile type

### No Changes Needed

- Existing storefront endpoints (catalog, cart, checkout, intake, webhooks)
- Auth flow mechanics
- Database models (affiliate fields on User, branding dict on Tenant already exist)

---

## Environment Variables

```env
# Required
STADIAN_API_KEY=sk_live_abc123

# Optional
STADIAN_API_URL=https://api.stadian.app   # defaults to production
RESEND_API_KEY=re_abc123                   # for transactional emails
```

---

## Out of Scope for V1

- Multiple templates / theme marketplace
- Visual theme editor / drag-and-drop builder
- Stadian-hosted storefronts
- Payment processing by Stadian
- Multi-language / i18n
- Reviews / ratings
- Wishlist
- Subscription / recurring orders

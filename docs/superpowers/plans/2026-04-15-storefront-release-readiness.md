# Storefront Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the stadian-storefront a production-ready, distributable reference storefront that tenants can clone, configure, and deploy.

**Architecture:** Five parallel workstreams — security hardening, payment integration, missing features, email/content cleanup, and SDK distribution prep. The storefront is a Next.js 16 app at `/Users/seanblock/Documents/GitHub/stadian-storefront`. The SDK lives at `/Users/seanblock/Documents/GitHub/peptide-platform/packages/storefront-sdk`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, @stadian/storefront-sdk

---

## File Structure

### Files to Create
- `stadian-storefront/src/middleware.ts` — Server-side route protection
- `stadian-storefront/src/app/account/orders/[id]/page.tsx` — Order detail (moved from `/order/[id]`)
- `stadian-storefront/src/app/account/intake/[id]/page.tsx` — Intake status (moved from `/intake/status/[id]`)
- `stadian-storefront/src/app/actions/payments.ts` — Payment server actions
- `stadian-storefront/src/app/actions/content.ts` — Content server actions (replaces lib/content.ts)
- `stadian-storefront/src/components/checkout/payment-section.tsx` — Payment form component
- `stadian-storefront/src/components/checkout/billing-address.tsx` — Billing address form
- `stadian-storefront/src/components/checkout/stored-methods.tsx` — Saved payment methods selector
- `stadian-storefront/src/components/layout/mobile-nav.tsx` — Mobile hamburger menu

### Files to Modify
- `stadian-storefront/next.config.ts` — Security headers, image restrictions
- `stadian-storefront/package.json` — Remove resend, update SDK dependency
- `stadian-storefront/src/app/api/webhooks/stadian/route.ts` — Fail-closed, remove emails
- `stadian-storefront/src/components/tiptap-renderer.tsx` — href sanitization
- `stadian-storefront/src/app/checkout/page.tsx` — Payment integration
- `stadian-storefront/src/app/actions/checkout.ts` — Payment params, referral code
- `stadian-storefront/src/app/actions/auth.ts` — Token refresh, referral cookie
- `stadian-storefront/src/app/account/layout.tsx` — Feature gating
- `stadian-storefront/src/app/account/orders/page.tsx` — Real order history
- `stadian-storefront/src/app/account/settings/page.tsx` — Profile editing
- `stadian-storefront/src/app/order/[id]/page.tsx` — Redirect to new path
- `stadian-storefront/src/app/intake/status/[id]/page.tsx` — Redirect to new path
- `stadian-storefront/src/components/layout/header.tsx` — Mobile nav, feature gating
- `stadian-storefront/src/components/cart/order-summary.tsx` — Discount code input
- `stadian-storefront/src/providers/auth-provider.tsx` — Token refresh support
- `stadian-storefront/src/app/about/page.tsx` — Use SDK via server action
- `stadian-storefront/src/app/faq/page.tsx` — Use SDK via server action
- `stadian-storefront/src/app/privacy/page.tsx` — Use SDK via server action
- `stadian-storefront/src/app/terms/page.tsx` — Use SDK via server action
- `stadian-storefront/src/app/returns/page.tsx` — Use SDK via server action
- `stadian-storefront/src/app/layout.tsx` — Referral tracking
- `stadian-storefront/.env.local.example` — Complete env vars
- `stadian-storefront/README.md` — Full documentation
- `peptide-platform/packages/storefront-sdk/package.json` — npm publish config
- `peptide-platform/packages/storefront-sdk/src/index.ts` — Add orders.list, customers.update, customers.changePassword

### Files to Delete
- `stadian-storefront/src/lib/email.ts`
- `stadian-storefront/src/lib/email-templates.ts`
- `stadian-storefront/src/lib/content.ts` (after migration)

---

## Workstream 1: Security & Config

### Task 1: Security Headers

**Files:**
- Modify: `stadian-storefront/next.config.ts`

- [ ] **Step 1: Replace next.config.ts with security headers**

```ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://secure.networkmerchants.com https://jstest.authorize.net https://js.authorize.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "frame-src 'self' https://secure.networkmerchants.com https://jstest.authorize.net https://js.authorize.net",
    ].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: isDev,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      ...(isDev ? [{ protocol: "http" as const, hostname: "localhost" }] : []),
    ],
  },
  turbopack: {},
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
```

Note: We keep `hostname: "**"` for now because tenants serve product images from their own domains which vary. The CSP `img-src 'self' data: https:` already restricts to HTTPS sources. Removing the wildcard would break tenant images.

- [ ] **Step 2: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add next.config.ts
git commit -m "security: add security headers and restrict dev-only image config"
```

---

### Task 2: Webhook Fail-Closed + Remove Email Sending

**Files:**
- Modify: `stadian-storefront/src/app/api/webhooks/stadian/route.ts`
- Delete: `stadian-storefront/src/lib/email.ts`
- Delete: `stadian-storefront/src/lib/email-templates.ts`
- Modify: `stadian-storefront/package.json` (remove `resend`)

- [ ] **Step 1: Rewrite the webhook handler**

Replace the entire file `src/app/api/webhooks/stadian/route.ts` with:

```ts
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const secret = process.env.STADIAN_WEBHOOK_SECRET;

  if (!secret) {
    console.error("STADIAN_WEBHOOK_SECRET is not configured — rejecting webhook");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-stadian-signature");

  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, data } = body;

  switch (event) {
    case "product.updated":
    case "product.created":
    case "product.deleted":
      revalidatePath("/products");
      revalidatePath("/");
      if (data?.slug) revalidatePath(`/products/${data.slug}`);
      break;

    case "order.created":
    case "order.shipped":
    case "order.cancelled":
      revalidatePath("/account/orders");
      if (data?.id) revalidatePath(`/account/orders/${data.id}`);
      break;

    case "intake.approved":
    case "intake.denied":
    case "intake.info_requested":
      if (data?.id) revalidatePath(`/account/intake/${data.id}`);
      break;

    case "page.updated":
      if (data?.slug) revalidatePath(`/${data.slug}`);
      break;
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Delete email files**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
rm src/lib/email.ts src/lib/email-templates.ts
```

- [ ] **Step 3: Remove resend dependency**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
npm uninstall resend
```

- [ ] **Step 4: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds. No imports of email.ts or email-templates.ts remain.

- [ ] **Step 5: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add -A
git commit -m "security: webhook fail-closed, remove storefront email sending

Email is handled by the Stadian platform's Resend plugin, not the storefront.
Webhook handler now only revalidates Next.js cache paths."
```

---

### Task 3: Tiptap href Sanitization

**Files:**
- Modify: `stadian-storefront/src/components/tiptap-renderer.tsx`

- [ ] **Step 1: Add href validation to the link mark handler**

In `src/components/tiptap-renderer.tsx`, replace the `case "link":` block (lines 21-31) with:

```tsx
      case "link": {
        const href = mark.attrs?.href ?? "";
        const isSafe = /^https?:\/\/|^mailto:/i.test(href);
        element = isSafe ? (
          <a
            href={href}
            target={mark.attrs?.target}
            rel={mark.attrs?.target === "_blank" ? "noopener noreferrer" : undefined}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {element}
          </a>
        ) : (
          <span>{element}</span>
        );
        break;
      }
```

- [ ] **Step 2: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/components/tiptap-renderer.tsx
git commit -m "security: sanitize tiptap link href to prevent javascript: XSS"
```

---

### Task 4: Server-Side Route Protection Middleware

**Files:**
- Create: `stadian-storefront/src/middleware.ts`

- [ ] **Step 1: Create the middleware**

Create `src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/account", "/intake"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("stadian_customer_token")?.value;
  if (token) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/:path*", "/intake/:path*"],
};
```

- [ ] **Step 2: Update the login page to handle redirect param**

In `src/app/login/page.tsx`, after successful login, check for the `redirect` search param and navigate there instead of `/account`. Find the router.push or redirect call after login and update it:

The login page should read `searchParams` and redirect accordingly. Find where the login success redirect happens and change it to:

```ts
const redirect = searchParams.get("redirect") || "/account";
router.push(redirect);
```

- [ ] **Step 3: Remove client-side auth guard from account layout**

In `src/app/account/layout.tsx`, remove the `useEffect` redirect block (lines 27-31) and the `if (!isAuthenticated) return null;` check (lines 41-43). The middleware handles this now. Keep the loading state check for the sidebar rendering.

- [ ] **Step 4: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/middleware.ts src/app/login/page.tsx src/app/account/layout.tsx
git commit -m "security: add server-side middleware for route protection"
```

---

### Task 5: IDOR Protection — Move Order & Intake Status Under /account

**Files:**
- Create: `stadian-storefront/src/app/account/orders/[id]/page.tsx`
- Create: `stadian-storefront/src/app/account/intake/[id]/page.tsx`
- Modify: `stadian-storefront/src/app/order/[id]/page.tsx` (redirect)
- Modify: `stadian-storefront/src/app/intake/status/[id]/page.tsx` (redirect)
- Modify: `stadian-storefront/src/app/checkout/page.tsx` (update redirect)
- Modify: `stadian-storefront/src/app/intake/[productId]/page.tsx` (update redirect)

- [ ] **Step 1: Create /account/orders/[id]/page.tsx**

Copy the content from `src/app/order/[id]/page.tsx` to `src/app/account/orders/[id]/page.tsx`. Change the import to also get the customer token for authorization:

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getStadianClient } from "@/lib/stadian";
import { getCustomerToken } from "@/app/actions/auth";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Order Details" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const token = await getCustomerToken();
  if (!token) notFound();

  let order;
  try {
    const client = getStadianClient();
    order = await client.orders.get(id);
  } catch {
    notFound();
  }

  if (!order) notFound();

  const isPaid = order.status !== "pending_payment" && order.status !== "pending";

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl font-semibold">
          {isPaid ? "Order Confirmed" : "Order Placed!"}
        </h1>
        {order.order_number && (
          <p className="text-sm text-muted-foreground">
            Order <span className="font-medium text-foreground">#{order.order_number}</span>
          </p>
        )}
        <Badge variant="secondary" className="capitalize">
          {order.status}
        </Badge>
      </div>

      <div className="flex flex-col gap-4">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600 dark:text-green-400">
                  -{formatCurrency(order.discount_amount)}
                </span>
              </div>
            )}
            {order.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Pending Notice */}
        {!isPaid && (
          <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                Payment Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Your order has been received but payment has not yet been
                collected. Please complete your payment according to the
                instructions provided by the store.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tracking Info */}
        {order.tracking_number && (
          <Card>
            <CardHeader>
              <CardTitle>Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tracking number:{" "}
                {order.tracking_url ? (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {order.tracking_number}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">
                    {order.tracking_number}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Continue Shopping */}
        <div className="mt-2 text-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create /account/intake/[id]/page.tsx**

Copy `src/app/intake/status/[id]/page.tsx` content to `src/app/account/intake/[id]/page.tsx`. It already calls `getIntakeStatus` which uses the SDK. The middleware protects it.

```tsx
import Link from "next/link";
import { getIntakeStatus } from "@/app/actions/intake";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type IntakeStatus = "pending" | "approved" | "denied" | "info_requested";

const statusConfig: Record<
  IntakeStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; message: string }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    message: "Your submission is under review.",
  },
  approved: {
    label: "Approved",
    variant: "default",
    message: "Approved! You can now purchase this product.",
  },
  denied: {
    label: "Denied",
    variant: "destructive",
    message: "Your submission was not approved.",
  },
  info_requested: {
    label: "Info Requested",
    variant: "outline",
    message: "Additional information is needed.",
  },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function IntakeStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let submission;
  try {
    submission = await getIntakeStatus(id);
  } catch {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load submission status. The submission may not exist.
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/products">Browse products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = submission.status as IntakeStatus;
  const config = statusConfig[status] ?? {
    label: submission.status,
    variant: "outline" as const,
    message: "",
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Intake Submission</CardTitle>
              <CardDescription className="mt-1 font-mono text-xs">
                {submission.id}
              </CardDescription>
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {config.message && (
            <p className="text-sm text-muted-foreground">{config.message}</p>
          )}

          <div className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Submitted</span>
              <span>{formatDate(submission.created_at)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Last updated</span>
              <span>{formatDate(submission.updated_at)}</span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Add redirects from old paths**

Replace `src/app/order/[id]/page.tsx` with a redirect:

```tsx
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/account/orders/${id}`);
}
```

Replace `src/app/intake/status/[id]/page.tsx` with a redirect:

```tsx
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function IntakeStatusRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/account/intake/${id}`);
}
```

- [ ] **Step 4: Update checkout success redirect**

In `src/app/checkout/page.tsx`, change line 55 from:
```ts
router.push(`/order/${order.id}`);
```
to:
```ts
router.push(`/account/orders/${order.id}`);
```

- [ ] **Step 5: Update intake form submission redirect**

In `src/app/intake/[productId]/page.tsx`, find the redirect after successful submission and change from `/intake/status/${submissionId}` to `/account/intake/${submissionId}`.

- [ ] **Step 6: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add -A
git commit -m "security: move order and intake pages behind auth middleware

Prevents unauthenticated access to order details and intake submissions.
Old paths redirect to new /account/* paths."
```

---

## Workstream 2: Payment Integration

### Task 6: Payment Server Actions

**Files:**
- Create: `stadian-storefront/src/app/actions/payments.ts`

- [ ] **Step 1: Create payment server actions**

Create `src/app/actions/payments.ts`:

```ts
"use server";

import { getStadianClient } from "@/lib/stadian";
import { getCustomerToken } from "@/app/actions/auth";
import type {
  PaymentClientConfig,
  StoredPaymentMethod,
} from "@stadian/storefront-sdk";

export async function getPaymentConfig(): Promise<PaymentClientConfig | null> {
  try {
    const client = getStadianClient();
    return await client.payments.getClientConfig();
  } catch {
    return null;
  }
}

export async function getStoredPaymentMethods(): Promise<StoredPaymentMethod[]> {
  const token = await getCustomerToken();
  if (!token) return [];

  try {
    const client = getStadianClient();
    return await client.payments.getStoredMethods();
  } catch {
    return [];
  }
}

export async function deletePaymentMethod(methodId: string): Promise<boolean> {
  const token = await getCustomerToken();
  if (!token) return false;

  try {
    const client = getStadianClient();
    await client.payments.deleteStoredMethod(methodId);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/app/actions/payments.ts
git commit -m "feat: add payment server actions for gateway config and stored methods"
```

---

### Task 7: Payment Section Component

**Files:**
- Create: `stadian-storefront/src/components/checkout/payment-section.tsx`
- Create: `stadian-storefront/src/components/checkout/stored-methods.tsx`
- Create: `stadian-storefront/src/components/checkout/billing-address.tsx`

- [ ] **Step 1: Create stored methods selector**

Create `src/components/checkout/stored-methods.tsx`:

```tsx
"use client";

import type { StoredPaymentMethod } from "@stadian/storefront-sdk";
import { Label } from "@/components/ui/label";

interface StoredMethodsProps {
  methods: StoredPaymentMethod[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function StoredMethods({ methods, selected, onSelect }: StoredMethodsProps) {
  if (methods.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <Label>Saved Payment Methods</Label>
      <div className="flex flex-col gap-2">
        {methods.map((method) => (
          <label
            key={method.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name="payment-method"
              value={method.id}
              checked={selected === method.id}
              onChange={() => onSelect(method.id)}
              className="size-4 accent-primary"
            />
            <span className="flex-1 text-sm">
              {method.label}
              {method.expires_at && (
                <span className="ml-2 text-muted-foreground">
                  exp {method.expires_at}
                </span>
              )}
            </span>
            {method.is_default && (
              <span className="text-xs text-muted-foreground">Default</span>
            )}
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input
            type="radio"
            name="payment-method"
            value=""
            checked={selected === null}
            onChange={() => onSelect(null)}
            className="size-4 accent-primary"
          />
          <span className="flex-1 text-sm">Use a new payment method</span>
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create billing address form**

Create `src/components/checkout/billing-address.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BillingAddressProps {
  sameAsShipping: boolean;
  onSameAsShippingChange: (same: boolean) => void;
}

export function BillingAddress({ sameAsShipping, onSameAsShippingChange }: BillingAddressProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={sameAsShipping}
          onChange={(e) => onSameAsShippingChange(e.target.checked)}
          className="size-4 accent-primary"
        />
        Same as shipping address
      </label>

      {!sameAsShipping && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="billing_line1">Address line 1</Label>
            <Input id="billing_line1" name="billing_line1" required autoComplete="billing address-line1" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="billing_line2">
              Address line 2 <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="billing_line2" name="billing_line2" autoComplete="billing address-line2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing_city">City</Label>
              <Input id="billing_city" name="billing_city" required autoComplete="billing address-level2" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing_state">State</Label>
              <Input id="billing_state" name="billing_state" required autoComplete="billing address-level1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing_zip">ZIP code</Label>
              <Input id="billing_zip" name="billing_zip" required autoComplete="billing postal-code" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing_country">Country</Label>
              <Input id="billing_country" name="billing_country" required autoComplete="billing country" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the payment section component**

Create `src/components/checkout/payment-section.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PaymentClientConfig,
  StoredPaymentMethod,
} from "@stadian/storefront-sdk";
import { PaymentForm, type TokenizeResult } from "@stadian/storefront-sdk/payment-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { StoredMethods } from "./stored-methods";
import { BillingAddress } from "./billing-address";

interface PaymentSectionProps {
  config: PaymentClientConfig | null;
  storedMethods: StoredPaymentMethod[];
  isAuthenticated: boolean;
}

export interface PaymentData {
  paymentToken?: string;
  paymentType?: "card" | "ach";
  paymentFlow?: "embedded" | "redirect";
  storedPaymentMethodId?: string;
  savePaymentMethod?: boolean;
  billingAddress?: Record<string, string>;
}

export function PaymentSection({
  config,
  storedMethods,
  isAuthenticated,
}: PaymentSectionProps) {
  const formRef = useRef<PaymentForm | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(
    storedMethods.find((m) => m.is_default)?.id ?? null,
  );
  const [paymentType, setPaymentType] = useState<"card" | "ach">("card");
  const [saveCard, setSaveCard] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!config?.gateway_enabled || config.checkout_mode === "redirect" || selectedMethod) {
      formRef.current?.destroy();
      formRef.current = null;
      setMounted(false);
      return;
    }

    let cancelled = false;
    PaymentForm.mount(config, {
      cardNumber: "card-number",
      cardExpiry: "card-expiry",
      cardCvv: "card-cvv",
      accountNumber: "account-number",
      routingNumber: "routing-number",
    }).then((form) => {
      if (cancelled) { form.destroy(); return; }
      formRef.current = form;
      setMounted(true);
    }).catch(console.error);

    return () => { cancelled = true; formRef.current?.destroy(); };
  }, [config, selectedMethod]);

  // No gateway configured — manual payment fallback
  if (!config?.gateway_enabled) {
    return (
      <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/30">
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Payment instructions will be included on your order confirmation
            page. Your order will be placed as <strong>payment pending</strong>{" "}
            and the store will reach out with next steps.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Redirect flow
  if (config.checkout_mode === "redirect") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You will be redirected to a secure payment page to complete your
            purchase after placing your order.
          </p>
          <BillingAddress sameAsShipping={sameAsShipping} onSameAsShippingChange={setSameAsShipping} />
        </CardContent>
      </Card>
    );
  }

  // Embedded flow
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isAuthenticated && storedMethods.length > 0 && (
          <StoredMethods
            methods={storedMethods}
            selected={selectedMethod}
            onSelect={setSelectedMethod}
          />
        )}

        {selectedMethod === null && (
          <>
            {config.ach_enabled && (
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="payment-type"
                    value="card"
                    checked={paymentType === "card"}
                    onChange={() => setPaymentType("card")}
                    className="size-4 accent-primary"
                  />
                  Card
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="payment-type"
                    value="ach"
                    checked={paymentType === "ach"}
                    onChange={() => setPaymentType("ach")}
                    className="size-4 accent-primary"
                  />
                  Bank Account
                </label>
              </div>
            )}

            {paymentType === "card" ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Card Number</Label>
                  <div id="card-number" className="h-10 rounded-md border border-input bg-background px-3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Expiry</Label>
                    <div id="card-expiry" className="h-10 rounded-md border border-input bg-background px-3" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>CVV</Label>
                    <div id="card-cvv" className="h-10 rounded-md border border-input bg-background px-3" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Routing Number</Label>
                  <div id="routing-number" className="h-10 rounded-md border border-input bg-background px-3" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Account Number</Label>
                  <div id="account-number" className="h-10 rounded-md border border-input bg-background px-3" />
                </div>
              </div>
            )}

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

        <BillingAddress sameAsShipping={sameAsShipping} onSameAsShippingChange={setSameAsShipping} />
      </CardContent>
    </Card>
  );
}
```

Note: The parent checkout page will call a `getPaymentData()` function exposed via ref or callback before submitting. The `PaymentForm.tokenize()` call happens there.

- [ ] **Step 4: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds. Note: `@stadian/storefront-sdk/payment-form` import may need adjustment based on SDK's export map — check and fix if needed.

- [ ] **Step 5: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/components/checkout/
git commit -m "feat: add payment section, stored methods, and billing address components"
```

---

### Task 8: Wire Payment Into Checkout Page

**Files:**
- Modify: `stadian-storefront/src/app/checkout/page.tsx`
- Modify: `stadian-storefront/src/app/actions/checkout.ts`

- [ ] **Step 1: Update the checkout server action to accept payment params**

Replace `src/app/actions/checkout.ts`:

```ts
"use server";

import { cookies } from "next/headers";
import { getStadianClient } from "@/lib/stadian";
import type { StorefrontOrder } from "@stadian/storefront-sdk";

export async function createOrder(
  sessionId: string,
  data: {
    customerEmail: string;
    shippingAddress: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    billingAddress?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    notes?: string;
    paymentToken?: string;
    paymentType?: "card" | "ach";
    paymentFlow?: "embedded" | "redirect";
    storedPaymentMethodId?: string;
    savePaymentMethod?: boolean;
  }
): Promise<StorefrontOrder> {
  const cookieStore = await cookies();
  const referralCode = cookieStore.get("stadian_ref")?.value;

  const client = getStadianClient();
  const order = await client.checkout.create({
    sessionToken: sessionId,
    customerEmail: data.customerEmail,
    shippingAddress: data.shippingAddress,
    billingAddress: data.billingAddress,
    notes: data.notes,
    paymentToken: data.paymentToken,
    paymentType: data.paymentType,
    paymentFlow: data.paymentFlow,
    storedPaymentMethodId: data.storedPaymentMethodId,
    savePaymentMethod: data.savePaymentMethod,
    paymentMethod: data.paymentToken || data.storedPaymentMethodId ? undefined : "pending",
    ...(referralCode ? { referralCode } : {}),
  });

  if (referralCode) {
    cookieStore.delete("stadian_ref");
  }

  return order;
}
```

- [ ] **Step 2: Rewrite the checkout page to integrate payment**

This is a large rewrite of `src/app/checkout/page.tsx`. The key changes:
- Fetch payment config and stored methods on mount
- Render the `PaymentSection` component instead of the yellow warning card
- On submit: tokenize via `PaymentForm` if using embedded flow, then call `createOrder` with payment params
- Handle redirect flow by following the redirect URL from the order response

Replace the entire file — the implementation agent should integrate the `PaymentSection` component, call `getPaymentConfig()` and `getStoredPaymentMethods()` on mount, handle tokenization in the submit handler, and pass all payment data to `createOrder`. The existing form fields (email, shipping address, notes) stay the same.

Key integration points in the submit handler:
```ts
// If using stored method
if (selectedStoredMethod) {
  orderData.storedPaymentMethodId = selectedStoredMethod;
}
// If using new card/ACH
else if (paymentForm) {
  const result = await paymentForm.tokenize();
  orderData.paymentToken = result.token;
  orderData.paymentType = result.payment_type;
  orderData.paymentFlow = "embedded";
  orderData.savePaymentMethod = saveCard;
}
// No gateway — manual payment
// (no payment fields needed, server defaults to "pending")
```

- [ ] **Step 3: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/app/checkout/page.tsx src/app/actions/checkout.ts
git commit -m "feat: integrate payment gateway into checkout flow

Supports embedded tokenization (NMI/Authorize.net), stored payment
methods, billing address, and manual payment fallback."
```

---

## Workstream 3: Missing Features

### Task 9: Add orders.list and customers.update to SDK

**Files:**
- Modify: `peptide-platform/packages/storefront-sdk/src/index.ts`

- [ ] **Step 1: Add orders.list method**

In the `OrdersResource` class (around line 232), add a `list` method before `get`:

```ts
  list(params: {
    customerToken: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedList<StorefrontOrder>> {
    return this.http.request<PaginatedList<StorefrontOrder>>(
      "GET",
      "/orders",
      {
        headers: { Authorization: `Bearer ${params.customerToken}` },
        query: { limit: params.limit, offset: params.offset },
      },
    );
  }
```

- [ ] **Step 2: Add customers.update and customers.changePassword methods**

In the `CustomersResource` class, add after the `me` method:

```ts
  update(params: {
    customerToken: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<StorefrontCustomerProfile> {
    return this.http.request<StorefrontCustomerProfile>(
      "PATCH",
      "/customers/me",
      {
        headers: { Authorization: `Bearer ${params.customerToken}` },
        body: {
          first_name: params.firstName,
          last_name: params.lastName,
          phone: params.phone,
        },
      },
    );
  }

  changePassword(params: {
    customerToken: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ ok: boolean }> {
    return this.http.request<{ ok: boolean }>(
      "POST",
      "/customers/change-password",
      {
        headers: { Authorization: `Bearer ${params.customerToken}` },
        body: {
          current_password: params.currentPassword,
          new_password: params.newPassword,
        },
      },
    );
  }
```

- [ ] **Step 3: Build the SDK**

Run: `cd /Users/seanblock/Documents/GitHub/peptide-platform/packages/storefront-sdk && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/peptide-platform
git add packages/storefront-sdk/src/index.ts
git commit -m "feat(sdk): add orders.list, customers.update, and customers.changePassword"
```

---

### Task 10: Order History Page

**Files:**
- Modify: `stadian-storefront/src/app/account/orders/page.tsx`
- Modify: `stadian-storefront/src/app/actions/account.ts`

- [ ] **Step 1: Add getOrderHistory server action**

Replace `src/app/actions/account.ts`:

```ts
"use server";

import { getStadianClient } from "@/lib/stadian";
import { getCustomerToken } from "@/app/actions/auth";
import type { StorefrontOrder, PaginatedList } from "@stadian/storefront-sdk";

export async function getOrderHistory(
  limit = 20,
  offset = 0,
): Promise<PaginatedList<StorefrontOrder>> {
  const token = await getCustomerToken();
  if (!token) return { items: [], total: 0, limit, offset };

  const client = getStadianClient();
  return client.orders.list({ customerToken: token, limit, offset });
}
```

- [ ] **Step 2: Rewrite the orders page**

Replace `src/app/account/orders/page.tsx`:

```tsx
import Link from "next/link";
import { getOrderHistory } from "@/app/actions/account";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function OrderHistoryPage() {
  const orders = await getOrderHistory();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your past and current orders.
        </p>
      </div>

      {orders.items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No orders yet</CardTitle>
            <CardDescription>
              When you place an order, it will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.items.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      #{order.order_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="capitalize">
                      {order.status}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/app/account/orders/page.tsx src/app/actions/account.ts
git commit -m "feat: wire up order history page with real data"
```

---

### Task 11: Profile Editing

**Files:**
- Modify: `stadian-storefront/src/app/account/settings/page.tsx`
- Modify: `stadian-storefront/src/app/actions/auth.ts`

- [ ] **Step 1: Add updateProfile and changePassword server actions**

Add to the bottom of `src/app/actions/auth.ts`:

```ts
export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<StorefrontCustomerProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  const client = getStadianClient();
  return client.customers.update({
    customerToken: token,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return { ok: false };

  const client = getStadianClient();
  return client.customers.changePassword({
    customerToken: token,
    currentPassword,
    newPassword,
  });
}
```

- [ ] **Step 2: Rewrite the settings page with edit forms**

Replace `src/app/account/settings/page.tsx` with a client component that:
- Shows the current profile fields as editable inputs (first name, last name, phone)
- Email is display-only
- Has a "Save Changes" button that calls `updateProfile()`
- Has a separate "Change Password" section with current password, new password, confirm new password fields
- Shows success/error messages
- Refreshes the auth context after successful update

The implementing agent should build this following the existing card/form patterns in the codebase.

- [ ] **Step 3: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/app/account/settings/page.tsx src/app/actions/auth.ts
git commit -m "feat: add profile editing and password change to account settings"
```

---

### Task 12: Token Refresh

**Files:**
- Modify: `stadian-storefront/src/app/actions/auth.ts`

- [ ] **Step 1: Add refresh token cookie management**

In `src/app/actions/auth.ts`, add a `REFRESH_TOKEN_COOKIE` constant and update `loginCustomer` to also store the refresh token:

After the existing `TOKEN_COOKIE` line, add:
```ts
const REFRESH_TOKEN_COOKIE = "stadian_refresh_token";
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
```

In `loginCustomer`, after setting the access token cookie, add:
```ts
  if (response.refresh_token) {
    cookieStore.set(REFRESH_TOKEN_COOKIE, response.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: "/",
    });
  }
```

- [ ] **Step 2: Add a refreshSession helper**

Add this function to `src/app/actions/auth.ts`:

```ts
export async function refreshSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return false;

  try {
    const client = getStadianClient();
    const response = await client.customers.refreshToken({ refreshToken });
    cookieStore.set(TOKEN_COOKIE, response.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    if (response.refresh_token) {
      cookieStore.set(REFRESH_TOKEN_COOKIE, response.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REFRESH_COOKIE_MAX_AGE,
        path: "/",
      });
    }
    return true;
  } catch {
    cookieStore.delete(TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
    return false;
  }
}
```

- [ ] **Step 3: Update getCustomerProfile to try refresh on failure**

Replace the existing `getCustomerProfile` function:

```ts
export async function getCustomerProfile(): Promise<StorefrontCustomerProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const client = getStadianClient();
    return await client.customers.me({ customerToken: token });
  } catch {
    const refreshed = await refreshSession();
    if (!refreshed) return null;

    const newToken = (await cookies()).get(TOKEN_COOKIE)?.value;
    if (!newToken) return null;

    try {
      const client = getStadianClient();
      return await client.customers.me({ customerToken: newToken });
    } catch {
      return null;
    }
  }
}
```

- [ ] **Step 4: Update logoutCustomer to clear both cookies**

```ts
export async function logoutCustomer(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}
```

- [ ] **Step 5: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/app/actions/auth.ts
git commit -m "feat: add silent token refresh with refresh token cookie"
```

---

### Task 13: Referral Tracking

**Files:**
- Modify: `stadian-storefront/src/app/layout.tsx`
- Modify: `stadian-storefront/src/middleware.ts`

- [ ] **Step 1: Capture referral code in middleware**

In `src/middleware.ts`, before the auth check, add referral tracking. Update the function:

```ts
import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/account", "/intake"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  let response = NextResponse.next();

  // Capture referral code from ?ref= param
  const ref = searchParams.get("ref");
  if (ref && !request.cookies.get("stadian_ref")) {
    response = NextResponse.next();
    response.cookies.set("stadian_ref", ref, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  // Protected route check
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isProtected) return response;

  const token = request.cookies.get("stadian_customer_token")?.value;
  if (token) return response;

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

Note: The matcher is updated to run on all pages (except static assets and API) so the referral code is captured on any landing page. The checkout action (already updated in Task 8) reads and clears the `stadian_ref` cookie.

- [ ] **Step 2: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/middleware.ts
git commit -m "feat: capture affiliate referral code from URL into cookie"
```

---

### Task 14: Mobile Navigation

**Files:**
- Create: `stadian-storefront/src/components/layout/mobile-nav.tsx`
- Modify: `stadian-storefront/src/components/layout/header.tsx`

- [ ] **Step 1: Create mobile nav component**

Create `src/components/layout/mobile-nav.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Add mobile nav to header**

In `src/components/layout/header.tsx`, import `MobileNav` and add it to the header. The desktop nav links should be hidden on mobile, and the hamburger menu shown instead:

Add import:
```tsx
import { MobileNav } from "./mobile-nav";
```

Add `<MobileNav />` before the logo link, and add `className="hidden md:flex"` to the desktop `<nav>` element (the one containing the Products/About/FAQ links).

- [ ] **Step 3: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/components/layout/mobile-nav.tsx src/components/layout/header.tsx
git commit -m "feat: add mobile hamburger navigation menu"
```

---

## Workstream 4: Email & Content Cleanup

### Task 15: Content Fetching via SDK

**Files:**
- Create: `stadian-storefront/src/app/actions/content.ts`
- Modify: `stadian-storefront/src/app/about/page.tsx`
- Modify: `stadian-storefront/src/app/faq/page.tsx`
- Modify: `stadian-storefront/src/app/privacy/page.tsx`
- Modify: `stadian-storefront/src/app/terms/page.tsx`
- Modify: `stadian-storefront/src/app/returns/page.tsx`
- Delete: `stadian-storefront/src/lib/content.ts`
- Modify: `stadian-storefront/src/components/tiptap-renderer.tsx` (move types inline)

- [ ] **Step 1: Create content server actions**

Create `src/app/actions/content.ts`:

```ts
"use server";

import { getStadianClient } from "@/lib/stadian";
import type {
  StorefrontPageResponse,
  StorefrontFaqResponse,
} from "@stadian/storefront-sdk";

export async function getPage(
  slug: "about" | "terms" | "privacy" | "returns",
): Promise<StorefrontPageResponse | null> {
  try {
    const client = getStadianClient();
    return await client.pages[slug]();
  } catch {
    return null;
  }
}

export async function getFaq(): Promise<StorefrontFaqResponse | null> {
  try {
    const client = getStadianClient();
    return await client.pages.faq();
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Move Tiptap types into the renderer**

In `src/components/tiptap-renderer.tsx`, replace the import from `@/lib/content` with inline type definitions:

Replace line 1:
```tsx
import type { TiptapDocument, TiptapMark, TiptapNode } from "@/lib/content";
```

With:
```tsx
export interface TiptapMark {
  type: "bold" | "italic" | "underline" | "strike" | "link";
  attrs?: { href?: string; target?: string };
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapDocument {
  type: "doc";
  content: TiptapNode[];
}
```

- [ ] **Step 3: Update page components to use server actions**

Update each content page to use the new server actions instead of importing from `lib/content.ts`. For example, `src/app/about/page.tsx` should import `getPage` from `@/app/actions/content` and call `await getPage("about")`.

The implementation agent should update all 5 pages (about, terms, privacy, returns, faq) following the same pattern.

- [ ] **Step 4: Delete lib/content.ts**

```bash
rm /Users/seanblock/Documents/GitHub/stadian-storefront/src/lib/content.ts
```

- [ ] **Step 5: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds with no broken imports.

- [ ] **Step 6: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add -A
git commit -m "refactor: fetch content pages via SDK instead of direct API calls

Removes lib/content.ts. All page content now goes through the
@stadian/storefront-sdk pages resource."
```

---

## Workstream 5: SDK & Distribution

### Task 16: SDK npm Publish Prep

**Files:**
- Modify: `peptide-platform/packages/storefront-sdk/package.json`

- [ ] **Step 1: Update package.json for npm publishing**

Replace `packages/storefront-sdk/package.json`:

```json
{
  "name": "@stadian/storefront-sdk",
  "version": "1.0.0",
  "description": "TypeScript SDK for the Stadian Storefront API",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/seanblock/peptide-platform.git",
    "directory": "packages/storefront-sdk"
  },
  "keywords": ["stadian", "storefront", "sdk", "ecommerce", "api-client"],
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./payment-form": {
      "types": "./dist/payment-form.d.ts",
      "import": "./dist/payment-form.js",
      "default": "./dist/payment-form.js"
    }
  },
  "files": ["dist", "README.md"],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Build and verify**

Run: `cd /Users/seanblock/Documents/GitHub/peptide-platform/packages/storefront-sdk && npm run build && ls dist/`
Expected: Build produces `dist/index.js`, `dist/index.d.ts`, `dist/payment-form.js`, `dist/payment-form.d.ts`, `dist/client.js`, `dist/client.d.ts`, `dist/types.js`, `dist/types.d.ts`, `dist/errors.js`, `dist/errors.d.ts`, and `dist/resources/payments.js` + `.d.ts`.

- [ ] **Step 3: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/peptide-platform
git add packages/storefront-sdk/package.json
git commit -m "chore(sdk): configure package.json for npm publishing"
```

---

### Task 17: Update Storefront SDK Dependency

**Files:**
- Modify: `stadian-storefront/package.json`

- [ ] **Step 1: Update the dependency**

In `stadian-storefront/package.json`, change:
```json
"@stadian/storefront-sdk": "file:../peptide-platform/packages/storefront-sdk"
```
to:
```json
"@stadian/storefront-sdk": "^1.0.0"
```

Note: Until the SDK is actually published to npm, local development should use `npm link`:
```bash
cd /Users/seanblock/Documents/GitHub/peptide-platform/packages/storefront-sdk && npm link
cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm link @stadian/storefront-sdk
```

- [ ] **Step 2: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add package.json
git commit -m "chore: update SDK dependency to npm package reference"
```

---

### Task 18: Complete .env.local.example and README

**Files:**
- Modify: `stadian-storefront/.env.local.example`
- Modify: `stadian-storefront/README.md`

- [ ] **Step 1: Update .env.local.example**

Replace `.env.local.example`:

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

- [ ] **Step 2: Rewrite README.md**

Replace `README.md` with a comprehensive document covering:

1. **Header** — "Stadian Storefront" + one-liner + badges
2. **Quick Start** — clone, copy env, install, dev (4 steps)
3. **Deploy** — Vercel deploy instructions, mention Netlify/self-hosted work too
4. **Environment Variables** — table with all 4 vars, all required, with descriptions
5. **Features** — bullet list: product catalog, cart, checkout with payment processing, auth (login/register/forgot/reset/verify), order history, intake forms, affiliate program, SEO (sitemap/robots/OG/JSON-LD), dark mode, mobile responsive
6. **Pages** — complete route table with all routes including `/account/*`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/intake/*`, content pages
7. **Customization** — theming (CSS vars in globals.css), branding (API-driven from dashboard), code modification
8. **Tech Stack** — Next.js 16, React 19, shadcn/ui, Tailwind CSS, @stadian/storefront-sdk
9. **SDK** — link to npm, mention it can be used independently
10. **License** — MIT

The implementation agent should write the full README content.

- [ ] **Step 3: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add .env.local.example README.md
git commit -m "docs: complete env example and comprehensive README"
```

---

### Task 19: Feature Gating (API-Driven)

**Files:**
- Modify: `peptide-platform/packages/storefront-sdk/src/index.ts` (add config resource)
- Modify: `peptide-platform/packages/storefront-sdk/src/types.ts` (add StoreConfig type)
- Create: `stadian-storefront/src/app/actions/config.ts`
- Modify: `stadian-storefront/src/app/account/layout.tsx`
- Modify: `stadian-storefront/src/components/layout/header.tsx`

- [ ] **Step 1: Add StoreConfig type to SDK**

In `packages/storefront-sdk/src/types.ts`, add:

```ts
export interface StoreConfig {
  features: {
    intake: boolean;
    affiliates: boolean;
    reviews: boolean;
    discount_codes: boolean;
    payment_gateway: boolean;
  };
}
```

- [ ] **Step 2: Add config resource to SDK**

In `packages/storefront-sdk/src/index.ts`, add a new `ConfigResource` class:

```ts
class ConfigResource {
  constructor(private http: HttpClient) {}

  get(): Promise<StoreConfig> {
    return this.http.request<StoreConfig>("GET", "/config");
  }
}
```

Add `public readonly config: ConfigResource;` to the `StadianClient` class and initialize it in the constructor: `this.config = new ConfigResource(this.http);`

Add `StoreConfig` to the type imports.

- [ ] **Step 3: Build the SDK**

Run: `cd /Users/seanblock/Documents/GitHub/peptide-platform/packages/storefront-sdk && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Create store config server action**

Create `src/app/actions/config.ts`:

```ts
"use server";

import { getStadianClient } from "@/lib/stadian";
import type { StoreConfig } from "@stadian/storefront-sdk";

const defaultConfig: StoreConfig = {
  features: {
    intake: true,
    affiliates: true,
    reviews: true,
    discount_codes: true,
    payment_gateway: true,
  },
};

export async function getStoreConfig(): Promise<StoreConfig> {
  try {
    const client = getStadianClient();
    return await client.config.get();
  } catch {
    return defaultConfig;
  }
}
```

Note: Falls back to all-features-enabled if the backend doesn't support this endpoint yet.

- [ ] **Step 5: Use config in account layout to show/hide affiliate nav**

In `src/app/account/layout.tsx`, fetch the store config and conditionally include the affiliate nav items. Import `getStoreConfig` from `@/app/actions/config`. Convert the layout to fetch config server-side and pass it down, or fetch in client component. Since the layout is already a client component, call `getStoreConfig()` in a `useEffect` and conditionally render affiliate nav items only when `config.features.affiliates` is true (instead of just checking `isAffiliate`).

- [ ] **Step 6: Use config in header to show/hide intake links**

If the storefront has any nav links to intake-related pages, conditionally render them based on `config.features.intake`.

- [ ] **Step 7: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/peptide-platform
git add packages/storefront-sdk/src/
git commit -m "feat(sdk): add store config resource for feature gating"

cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/app/actions/config.ts src/app/account/layout.tsx src/components/layout/header.tsx
git commit -m "feat: add API-driven feature gating for intake and affiliates"
```

---

### Task 20: Discount Code UI

**Files:**
- Modify: `stadian-storefront/src/components/cart/order-summary.tsx`
- Modify: `stadian-storefront/src/app/actions/cart.ts`

- [ ] **Step 1: Add applyDiscount server action**

Add to `src/app/actions/cart.ts`:

```ts
export async function applyDiscountCode(
  sessionId: string,
  code: string,
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.addItem({
    sessionToken: sessionId,
    productId: "",
    quantity: 0,
    discountCode: code,
  } as AddCartItemParams & { discountCode: string });
}
```

Note: The exact API endpoint for discount code application depends on the backend implementation. If the SDK doesn't support this yet, the implementing agent should check the backend API for a dedicated discount endpoint (e.g., `POST /cart/discount`) and add the corresponding SDK method. The UI should be built regardless — the server action can be adjusted when the endpoint is confirmed.

- [ ] **Step 2: Add promo code input to order summary**

In `src/components/cart/order-summary.tsx`, add a collapsible promo code section before the totals. Add a text input with an "Apply" button. On success, refresh the cart. On error, show an inline error message.

```tsx
// Add inside OrderSummary, before the subtotal line:
const [promoCode, setPromoCode] = useState("");
const [promoError, setPromoError] = useState<string | null>(null);
const [applying, setApplying] = useState(false);

// Collapsible section:
<details className="group">
  <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
    Have a promo code?
  </summary>
  <div className="mt-2 flex gap-2">
    <Input
      value={promoCode}
      onChange={(e) => setPromoCode(e.target.value)}
      placeholder="Enter code"
      className="h-8 text-sm"
    />
    <Button
      variant="outline"
      size="sm"
      disabled={!promoCode || applying}
      onClick={async () => {
        setApplying(true);
        setPromoError(null);
        try {
          await applyDiscountCode(sessionId, promoCode);
          // Cart provider will refresh
        } catch (err) {
          setPromoError("Invalid or expired code");
        } finally {
          setApplying(false);
        }
      }}
    >
      Apply
    </Button>
  </div>
  {promoError && (
    <p className="mt-1 text-xs text-destructive">{promoError}</p>
  )}
</details>
```

Note: This component needs access to `sessionId` and the cart refresh function. The implementing agent should thread these through props or use the `useCart()` context.

- [ ] **Step 3: Verify the build passes**

Run: `cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
git add src/components/cart/order-summary.tsx src/app/actions/cart.ts
git commit -m "feat: add promo code input to cart order summary"
```

---

### Task 21: Fix PaymentClientConfig Type

**Files:**
- Modify: `peptide-platform/packages/storefront-sdk/src/types.ts`

The `PaymentClientConfig` type is missing `checkout_mode` and `ach_enabled` fields that the payment section component references.

- [ ] **Step 1: Update the type**

In `packages/storefront-sdk/src/types.ts`, replace the `PaymentClientConfig` interface:

```ts
export interface PaymentClientConfig {
  gateway_enabled: boolean;
  gateway_type: "nmi" | "authorizenet" | null;
  checkout_mode: "embedded" | "redirect";
  ach_enabled: boolean;
  js_library_url: string | null;
  public_key: string | null;
  form_config: Record<string, unknown>;
}
```

- [ ] **Step 2: Build the SDK**

Run: `cd /Users/seanblock/Documents/GitHub/peptide-platform/packages/storefront-sdk && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/seanblock/Documents/GitHub/peptide-platform
git add packages/storefront-sdk/src/types.ts
git commit -m "fix(sdk): add checkout_mode and ach_enabled to PaymentClientConfig"
```

---

## Task Dependencies

Tasks within each workstream are sequential. Workstreams are independent and can run in parallel:

- **Workstream 1 (Tasks 1-5):** Security — no dependencies
- **Workstream 2 (Tasks 6-8, 21):** Payments — Task 21 before Tasks 7-8
- **Workstream 3 (Tasks 9-14, 19-20):** Features — Task 9 (SDK changes) before Tasks 10-11; Task 19 before feature gating in UI; Task 21 before Task 7
- **Workstream 4 (Task 15):** Content — no dependencies
- **Workstream 5 (Tasks 16-18):** Distribution — Task 16 before 17, all other workstreams should complete before Task 17 (so the dependency change is last)

**Recommended execution order for parallel agents:**
- Agent 1: Tasks 1, 2, 3 (security headers, webhook, tiptap)
- Agent 2: Tasks 21, 6, 7, 8 (fix type, payment actions, payment components, checkout integration)
- Agent 3: Tasks 9, 10, 11, 12, 19 (SDK methods, order history, profile, token refresh, feature gating)
- Agent 4: Tasks 4, 5, 13, 14, 20 (middleware, IDOR, referral, mobile nav, discount codes)
- Agent 5: Tasks 15, 16, 18 (content cleanup, SDK prep, README)
- Final (after all): Task 17 (update SDK dependency)

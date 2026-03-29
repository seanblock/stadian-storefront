# Stadian Storefront Phase 2a — Scaffold + Catalog + Cart + Checkout

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Next.js storefront template that connects to the Stadian API — tenants can browse products, add to cart, and place orders.

**Architecture:** Next.js App Router with Server Components for catalog pages (SSR/ISR for SEO), client-side cart state via React context with localStorage session persistence, and the `@stadian/storefront-sdk` for all API communication. Branding fetched server-side and applied via CSS variables.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, TypeScript, @stadian/storefront-sdk

**UI Components:** All UI must use shadcn/ui primitives (Button, Card, Input, Badge, Label, Separator, etc.). Tenants restyle by modifying the shadcn CSS variables and component source code. Never use raw `<button>`, `<input>`, or `<select>` elements — always use the shadcn equivalents.

**Spec:** `docs/specs/2026-03-28-stadian-storefront-design.md`

**Repo:** `/Users/seanblock/Documents/GitHub/stadian-storefront` (new, empty)

**SDK source:** `/Users/seanblock/Documents/GitHub/peptide-platform/packages/storefront-sdk` (link locally during dev)

---

## File Structure

```
stadian-storefront/
├── .env.local.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── tsconfig.json
├── lib/
│   ├── stadian.ts              # Server-side SDK singleton
│   ├── stadian-client.ts       # Client-side SDK singleton (for cart/auth)
│   ├── branding.ts             # Fetch + cache branding, CSS variable mapping
│   ├── session.ts              # Cart session ID management
│   └── utils.ts                # Format currency, cn() helper
├── providers/
│   └── cart-provider.tsx        # Cart context — state, add/remove/update, session
├── components/
│   ├── layout/
│   │   ├── header.tsx           # Store name, nav links, cart icon
│   │   ├── footer.tsx           # Footer text, social links
│   │   └── cart-icon.tsx        # Cart item count badge in header
│   ├── products/
│   │   ├── product-card.tsx     # Card for catalog grid
│   │   ├── product-grid.tsx     # Responsive grid wrapper
│   │   └── price-display.tsx    # Format price with tier info
│   └── cart/
│       ├── cart-item-row.tsx    # Single cart line item with qty controls
│       └── order-summary.tsx    # Subtotal/tax/discount/total display
├── app/
│   ├── layout.tsx               # Root — branding CSS vars, header, footer, providers
│   ├── page.tsx                 # Homepage — featured products
│   ├── products/
│   │   ├── page.tsx             # Catalog — search, filter, grid
│   │   └── [slug]/page.tsx      # Product detail — images, description, add to cart
│   ├── cart/page.tsx            # Cart — items, promo code, checkout button
│   ├── checkout/page.tsx        # Checkout — shipping, payment instructions, place order
│   └── order/
│       └── [id]/page.tsx        # Order confirmation — status, details
└── public/
    └── placeholder-product.svg  # Fallback product image
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.local.example`, `.gitignore`

- [ ] **Step 1: Initialize the Next.js project**

```bash
cd /Users/seanblock/Documents/GitHub/stadian-storefront
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint --no-turbopack
```

When prompted, accept defaults. This creates the standard Next.js scaffold.

- [ ] **Step 2: Link the storefront SDK locally**

```bash
cd /Users/seanblock/Documents/GitHub/peptide-platform/packages/storefront-sdk && npm link
cd /Users/seanblock/Documents/GitHub/stadian-storefront && npm link @stadian/storefront-sdk
```

- [ ] **Step 3: Create .env.local.example**

```bash
# .env.local.example
STADIAN_API_KEY=sk_live_your_api_key_here
STADIAN_API_URL=http://localhost:8000
```

- [ ] **Step 4: Create .env.local for local development**

```bash
# .env.local
STADIAN_API_KEY=sk_live_your_actual_key
STADIAN_API_URL=http://localhost:8000
```

- [ ] **Step 5: Update .gitignore to include .env.local**

Verify `.env*.local` is in `.gitignore` (create-next-app should handle this).

- [ ] **Step 6: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

Then install the components we'll need across all tasks:

```bash
npx shadcn@latest add button card input badge separator label textarea select sheet
```

- [ ] **Step 7: Clean up scaffold**

Remove the default `app/page.tsx` content and `public/` default assets. Replace `app/page.tsx` with a simple placeholder:

```tsx
// app/page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Stadian Storefront</h1>
      <Button asChild>
        <Link href="/products">Browse Products</Link>
      </Button>
    </main>
  );
}
```

- [ ] **Step 8: Verify dev server runs**

```bash
npm run dev
```

Open http://localhost:3000 — should show "Stadian Storefront" with a shadcn Button.

- [ ] **Step 9: Initialize git and commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js storefront project with shadcn/ui"
```

---

### Task 2: SDK Integration + Utilities

**Files:**
- Create: `lib/stadian.ts`, `lib/stadian-client.ts`, `lib/session.ts`, `lib/utils.ts`

- [ ] **Step 1: Create server-side SDK client**

```typescript
// lib/stadian.ts
import { StadianClient } from "@stadian/storefront-sdk";

let client: StadianClient | null = null;

export function getStadianClient(): StadianClient {
  if (!client) {
    const apiKey = process.env.STADIAN_API_KEY;
    const baseUrl = process.env.STADIAN_API_URL;
    if (!apiKey || !baseUrl) {
      throw new Error(
        "Missing STADIAN_API_KEY or STADIAN_API_URL environment variables"
      );
    }
    client = new StadianClient({ apiKey, baseUrl });
  }
  return client;
}
```

- [ ] **Step 2: Create client-side SDK client**

```typescript
// lib/stadian-client.ts
"use client";

import { StadianClient } from "@stadian/storefront-sdk";

let client: StadianClient | null = null;

export function getClientStadian(): StadianClient {
  if (!client) {
    // These are public — exposed to the browser via NEXT_PUBLIC_ prefix
    // For now, we route client requests through Next.js API routes instead
    // This file is a placeholder for direct client-side SDK usage if needed
    throw new Error("Use server actions or API routes for SDK calls");
  }
  return client;
}
```

- [ ] **Step 3: Create session management**

```typescript
// lib/session.ts
"use client";

const SESSION_KEY = "stadian_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}
```

- [ ] **Step 4: Add formatCurrency to utils**

shadcn/ui already created `lib/utils.ts` with the `cn()` helper. Add `formatCurrency` to it:

```typescript
// Add to lib/utils.ts (after existing cn function)

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add lib/
git commit -m "feat: add SDK integration and utility modules"
```

---

### Task 3: Branding + Root Layout

**Files:**
- Create: `lib/branding.ts`, `components/layout/header.tsx`, `components/layout/footer.tsx`, `components/layout/cart-icon.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create branding module**

```typescript
// lib/branding.ts
import { getStadianClient } from "./stadian";
import type { StorefrontBranding } from "@stadian/storefront-sdk";

let cachedBranding: StorefrontBranding | null = null;

export async function getBranding(): Promise<StorefrontBranding> {
  if (cachedBranding) return cachedBranding;

  try {
    const client = getStadianClient();
    cachedBranding = await client.branding.get();
    return cachedBranding;
  } catch {
    // Return defaults if branding fetch fails
    return {
      store_name: "Store",
      tagline: null,
      logo_url: null,
      primary_color: "#2563eb",
      accent_color: "#10b981",
      mode: "light",
      social_links: null,
      footer_text: null,
    };
  }
}

export function brandingToCssVars(branding: StorefrontBranding): Record<string, string> {
  return {
    "--color-primary": branding.primary_color || "#2563eb",
    "--color-accent": branding.accent_color || "#10b981",
  };
}
```

- [ ] **Step 2: Create header component**

```tsx
// components/layout/header.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartIcon } from "./cart-icon";

interface HeaderProps {
  storeName: string;
  logoUrl: string | null;
}

export function Header({ storeName, logoUrl }: HeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt={storeName} className="h-8 w-auto" />
          )}
          <span className="text-lg font-bold">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/products">Products</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-4">
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create cart icon (placeholder)**

```tsx
// components/layout/cart-icon.tsx
"use client";

import Link from "next/link";
import { useCart } from "@/providers/cart-provider";

export function CartIcon() {
  let itemCount = 0;

  // Cart provider will be added in Task 4 — for now, show static icon
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { cart } = useCart();
    itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  } catch {
    // CartProvider not yet mounted — show 0
  }

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.002-.882 2.002-2.003V6.75m-14.22 0h14.22"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 4: Create footer component**

```tsx
// components/layout/footer.tsx
interface FooterProps {
  footerText: string | null;
  socialLinks: Record<string, string> | null;
}

export function Footer({ footerText, socialLinks }: FooterProps) {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            {footerText || "\u00A9 " + new Date().getFullYear()}
          </p>
          {socialLinks && Object.keys(socialLinks).length > 0 && (
            <div className="flex gap-4">
              {Object.entries(socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm capitalize text-gray-500 hover:text-gray-700"
                >
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Update root layout**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getBranding, brandingToCssVars } from "@/lib/branding";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  return {
    title: {
      default: branding.store_name || "Store",
      template: `%s | ${branding.store_name || "Store"}`,
    },
    description: branding.tagline || undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getBranding();
  const cssVars = brandingToCssVars(branding);

  return (
    <html lang="en" style={cssVars as React.CSSProperties}>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Header
          storeName={branding.store_name || "Store"}
          logoUrl={branding.logo_url}
        />
        <main className="flex-1">{children}</main>
        <Footer
          footerText={branding.footer_text}
          socialLinks={branding.social_links}
        />
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify dev server renders layout**

```bash
npm run dev
```

Open http://localhost:3000 — should show header with store name, main content, and footer. If STADIAN_API_KEY is configured, branding should load from the API.

- [ ] **Step 7: Commit**

```bash
git add lib/branding.ts components/layout/ app/layout.tsx
git commit -m "feat: add branding, header, footer, and root layout"
```

---

### Task 4: Cart Provider

**Files:**
- Create: `providers/cart-provider.tsx`
- Create: `app/actions/cart.ts` (server actions for cart operations)

- [ ] **Step 1: Create cart server actions**

```typescript
// app/actions/cart.ts
"use server";

import { getStadianClient } from "@/lib/stadian";
import type { StorefrontCart } from "@stadian/storefront-sdk";

export async function getCart(sessionId: string): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.get({ sessionToken: sessionId });
}

export async function addToCart(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.addItem({ sessionToken: sessionId, productId, quantity });
}

export async function updateCartItem(
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.updateItem({ sessionToken: sessionId, itemId, quantity });
}

export async function removeCartItem(
  sessionId: string,
  itemId: string
): Promise<StorefrontCart> {
  const client = getStadianClient();
  return client.cart.removeItem({ sessionToken: sessionId, itemId });
}
```

- [ ] **Step 2: Create cart provider**

```tsx
// providers/cart-provider.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { StorefrontCart } from "@stadian/storefront-sdk";
import { getSessionId } from "@/lib/session";
import {
  getCart,
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  removeCartItem as removeCartItemAction,
} from "@/app/actions/cart";

interface CartContextValue {
  cart: StorefrontCart | null;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      const data = await getCart(sessionId);
      setCart(data);
    } catch {
      // Cart fetch failed — leave as null
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      const sessionId = getSessionId();
      const updated = await addToCartAction(sessionId, productId, quantity);
      setCart(updated);
    },
    []
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      const sessionId = getSessionId();
      const updated = await updateCartItemAction(sessionId, itemId, quantity);
      setCart(updated);
    },
    []
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const sessionId = getSessionId();
      const updated = await removeCartItemAction(sessionId, itemId);
      setCart(updated);
    },
    []
  );

  return (
    <CartContext.Provider
      value={{ cart, loading, addItem, updateItem, removeItem, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
```

- [ ] **Step 3: Wrap layout with CartProvider**

Update `app/layout.tsx` — import `CartProvider` and wrap `{children}`:

```tsx
import { CartProvider } from "@/providers/cart-provider";

// ... inside RootLayout, wrap main:
<CartProvider>
  <main className="flex-1">{children}</main>
</CartProvider>
```

- [ ] **Step 4: Update cart-icon.tsx to use the provider properly**

Replace the try/catch hack with proper usage now that CartProvider exists:

```tsx
// components/layout/cart-icon.tsx
"use client";

import Link from "next/link";
import { useCart } from "@/providers/cart-provider";

export function CartIcon() {
  const { cart } = useCart();
  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.002-.882 2.002-2.003V6.75m-14.22 0h14.22"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 5: Verify dev server — cart icon should render without errors**

```bash
npm run dev
```

Expected: No hydration errors, cart icon visible in header.

- [ ] **Step 6: Commit**

```bash
git add providers/ app/actions/ components/layout/cart-icon.tsx app/layout.tsx
git commit -m "feat: add cart provider with server actions and session management"
```

---

### Task 5: Product Catalog Page

**Files:**
- Create: `components/products/product-card.tsx`, `components/products/product-grid.tsx`, `components/products/price-display.tsx`
- Create: `app/products/page.tsx`
- Modify: `app/page.tsx` (homepage shows featured products)

- [ ] **Step 1: Create price display component**

```tsx
// components/products/price-display.tsx
import { formatCurrency } from "@/lib/utils";
import type { StorefrontPrice } from "@stadian/storefront-sdk";

interface PriceDisplayProps {
  prices: StorefrontPrice[];
}

export function PriceDisplay({ prices }: PriceDisplayProps) {
  if (prices.length === 0) return <span className="text-gray-400">No price</span>;

  const retailPrice = prices.find((p) => p.tier_name === "Retail") ?? prices[0];

  return (
    <span className="text-lg font-bold text-gray-900">
      {formatCurrency(retailPrice.price, retailPrice.currency)}
    </span>
  );
}
```

- [ ] **Step 2: Create product card component**

```tsx
// components/products/product-card.tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StorefrontProduct } from "@stadian/storefront-sdk";

interface ProductCardProps {
  product: StorefrontProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="overflow-hidden transition hover:shadow-md">
        <div className="aspect-square bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-12 w-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold group-hover:text-primary">
            {product.name}
          </h3>
          {product.form_type && (
            <Badge variant="secondary" className="mt-2">
              {product.form_type}
            </Badge>
          )}
          {product.category_name && (
            <p className="mt-1 text-sm text-muted-foreground">{product.category_name}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3: Create product grid component**

```tsx
// components/products/product-grid.tsx
import type { StorefrontProduct } from "@stadian/storefront-sdk";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: StorefrontProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p className="text-lg">No products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create catalog page**

```tsx
// app/products/page.tsx
import { getStadianClient } from "@/lib/stadian";
import { ProductGrid } from "@/components/products/product-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const client = getStadianClient();
  const page = Number(params.page) || 1;

  const products = await client.catalog.list({
    page,
    limit: 20,
    search: params.search,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <form className="flex">
          <Input
            type="search"
            name="search"
            defaultValue={params.search}
            placeholder="Search products..."
            className="w-64"
          />
        </form>
      </div>

      <ProductGrid products={products.items} />

      {products.total > 20 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link href={`/products?page=${page - 1}${params.search ? `&search=${params.search}` : ""}`}>
                Previous
              </Link>
            </Button>
          )}
          {page * 20 < products.total && (
            <Button variant="outline" asChild>
              <Link href={`/products?page=${page + 1}${params.search ? `&search=${params.search}` : ""}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Update homepage to show featured products**

```tsx
// app/page.tsx
import { getStadianClient } from "@/lib/stadian";
import { ProductGrid } from "@/components/products/product-grid";
import { getBranding } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  const client = getStadianClient();
  const branding = await getBranding();
  const products = await client.catalog.list({ limit: 8 });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {branding.store_name || "Welcome"}
          </h1>
          {branding.tagline && (
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
              {branding.tagline}
            </p>
          )}
          <Button size="lg" asChild className="mt-8">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-xl font-bold">Featured Products</h2>
        <ProductGrid products={products.items} />
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Verify catalog page renders with real data**

```bash
npm run dev
```

Open http://localhost:3000/products — should show product grid fetched from the API. Homepage should show hero + featured products.

- [ ] **Step 7: Commit**

```bash
git add components/products/ app/products/ app/page.tsx
git commit -m "feat: add product catalog page and homepage with featured products"
```

---

### Task 6: Product Detail Page

**Files:**
- Create: `app/products/[slug]/page.tsx`

- [ ] **Step 1: Create product detail page**

```tsx
// app/products/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getStadianClient } from "@/lib/stadian";
import { PriceDisplay } from "@/components/products/price-display";
import { AddToCartButton } from "./add-to-cart-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const client = getStadianClient();
    const product = await client.catalog.get(slug);
    return {
      title: product.name,
      description: product.description?.slice(0, 160),
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const client = getStadianClient();

  let product;
  try {
    product = await client.catalog.get(slug);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-24 w-24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.form_type && (
            <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-primary)]">
              {product.form_type}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="mt-4">
            <PriceDisplay prices={product.prices} />
          </div>

          {product.description && (
            <div className="mt-6 text-gray-600 leading-relaxed">
              <p>{product.description}</p>
            </div>
          )}

          <div className="mt-8">
            {product.requires_intake ? (
              <p className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                This product requires an intake form before purchase. Please complete the intake form first.
              </p>
            ) : (
              <AddToCartButton productId={product.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create add-to-cart button (client component)**

```tsx
// app/products/[slug]/add-to-cart-button.tsx
"use client";

import { useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productId: string;
}

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addItem(productId, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center rounded-lg border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        >
          -
        </Button>
        <span className="min-w-[2rem] text-center text-sm font-medium">
          {quantity}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setQuantity((q) => q + 1)}
        >
          +
        </Button>
      </div>

      <Button
        className="flex-1"
        size="lg"
        onClick={handleAdd}
        disabled={adding}
      >
        {adding ? "Adding..." : added ? "Added!" : "Add to Cart"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Verify product detail page**

```bash
npm run dev
```

Navigate to a product from the catalog. Should show image, name, price, description, and add-to-cart button. Clicking "Add to Cart" should update the cart icon count in the header.

- [ ] **Step 4: Commit**

```bash
git add app/products/\[slug\]/
git commit -m "feat: add product detail page with add-to-cart"
```

---

### Task 7: Cart Page

**Files:**
- Create: `components/cart/cart-item-row.tsx`, `components/cart/order-summary.tsx`
- Create: `app/cart/page.tsx`

- [ ] **Step 1: Create cart item row component**

```tsx
// components/cart/cart-item-row.tsx
"use client";

import Link from "next/link";
import type { StorefrontCartItem } from "@stadian/storefront-sdk";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CartItemRowProps {
  item: StorefrontCartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateItem, removeItem } = useCart();

  return (
    <>
      <div className="flex items-center gap-4 py-4">
        <div className="flex-1">
          <Link
            href={`/products/${item.product_slug}`}
            className="font-medium hover:text-primary"
          >
            {item.product_name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCurrency(item.unit_price)} each
          </p>
        </div>

        <div className="flex items-center rounded-lg border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              item.quantity > 1
                ? updateItem(item.id, item.quantity - 1)
                : removeItem(item.id)
            }
          >
            -
          </Button>
          <span className="min-w-[2rem] text-center text-sm font-medium">
            {item.quantity}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateItem(item.id, item.quantity + 1)}
          >
            +
          </Button>
        </div>

        <div className="w-24 text-right font-medium">
          {formatCurrency(item.line_total)}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(item.id)}
        >
          Remove
        </Button>
      </div>
      <Separator />
    </>
  );
}
```

- [ ] **Step 2: Create order summary component**

```tsx
// components/cart/order-summary.tsx
import type { StorefrontCart } from "@stadian/storefront-sdk";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface OrderSummaryProps {
  cart: StorefrontCart;
}

export function OrderSummary({ cart }: OrderSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium">{formatCurrency(cart.subtotal)}</dd>
        </div>
        {cart.discount_amount > 0 && (
          <div className="flex justify-between text-green-600">
            <dt>Discount</dt>
            <dd className="font-medium">
              -{formatCurrency(cart.discount_amount)}
            </dd>
          </div>
        )}
        {cart.tax_amount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="font-medium">{formatCurrency(cart.tax_amount)}</dd>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-base font-bold">
          <dt>Total</dt>
          <dd>{formatCurrency(cart.total)}</dd>
        </div>
      </dl>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create cart page**

```tsx
// app/cart/page.tsx
"use client";

import Link from "next/link";
import { useCart } from "@/providers/cart-provider";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { cart, loading } = useCart();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Browse our products to get started.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <div>
          <OrderSummary cart={cart} />
          <Button asChild className="mt-4 w-full" size="lg">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify cart page**

```bash
npm run dev
```

Add a product to cart from the product detail page, then navigate to /cart. Should show cart items with quantity controls, order summary, and checkout button.

- [ ] **Step 5: Commit**

```bash
git add components/cart/ app/cart/
git commit -m "feat: add cart page with item management and order summary"
```

---

### Task 8: Checkout Page

**Files:**
- Create: `app/actions/checkout.ts`
- Create: `app/checkout/page.tsx`

- [ ] **Step 1: Create checkout server action**

```typescript
// app/actions/checkout.ts
"use server";

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
    paymentMethod?: string;
    notes?: string;
  }
): Promise<StorefrontOrder> {
  const client = getStadianClient();
  return client.checkout.create({
    sessionToken: sessionId,
    customerEmail: data.customerEmail,
    shippingAddress: data.shippingAddress,
    paymentMethod: data.paymentMethod || "pending",
    notes: data.notes,
  });
}
```

- [ ] **Step 2: Create checkout page**

```tsx
// app/checkout/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/cart-provider";
import { OrderSummary } from "@/components/cart/order-summary";
import { createOrder } from "@/app/actions/checkout";
import { getSessionId, clearSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("US");
  const [notes, setNotes] = useState("");

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    router.push("/cart");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const sessionId = getSessionId();
      const order = await createOrder(sessionId, {
        customerEmail: email,
        shippingAddress: { line1, line2, city, state, zip, country },
        notes: notes || undefined,
      });
      clearSession();
      router.push(`/order/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  required
                  placeholder="Address line 1"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                />
                <Input
                  placeholder="Address line 2 (optional)"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    required
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <Input
                    required
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    required
                    placeholder="ZIP code"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                  />
                  <Input
                    required
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800">
                  Payment instructions will be provided on the order confirmation page.
                  Your order will be placed as &quot;payment pending&quot; until payment is confirmed.
                </p>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any special instructions (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <OrderSummary cart={cart} />

            {error && (
              <Card className="mt-4 border-destructive bg-destructive/10">
                <CardContent className="p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full"
              size="lg"
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verify checkout flow**

```bash
npm run dev
```

Add product to cart → go to cart → click "Proceed to Checkout" → fill form → submit. Should redirect to order confirmation.

- [ ] **Step 4: Commit**

```bash
git add app/actions/checkout.ts app/checkout/
git commit -m "feat: add checkout page with shipping form and order creation"
```

---

### Task 9: Order Confirmation Page

**Files:**
- Create: `app/order/[id]/page.tsx`

- [ ] **Step 1: Create order confirmation page**

```tsx
// app/order/[id]/page.tsx
import { notFound } from "next/navigation";
import { getStadianClient } from "@/lib/stadian";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Order Confirmation" };

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const client = getStadianClient();

  let order;
  try {
    order = await client.orders.get(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="text-center">
        <CardContent className="p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6 text-green-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold">Order Placed!</h1>

          {order.order_number && (
            <p className="mt-2 text-muted-foreground">
              Order #{order.order_number}
            </p>
          )}

          <Badge variant="secondary" className="mt-2 capitalize">
            {order.status}
          </Badge>

          <Card className="mt-6 text-left">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">{formatCurrency(order.subtotal)}</dd>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <dt>Discount</dt>
                    <dd>-{formatCurrency(order.discount_amount)}</dd>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tax</dt>
                    <dd className="font-medium">{formatCurrency(order.tax_amount)}</dd>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(order.total)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="mt-4 border-yellow-200 bg-yellow-50 text-left">
            <CardContent className="p-4">
              <h3 className="font-semibold text-yellow-800">Payment Instructions</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Your order has been placed. Please complete payment using the method
                provided by the store. Your order will be processed once payment is
                confirmed.
              </p>
            </CardContent>
          </Card>

          {order.tracking_number && (
            <div className="mt-4 text-left text-sm">
              <p className="text-muted-foreground">
                Tracking:{" "}
                {order.tracking_url ? (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {order.tracking_number}
                  </a>
                ) : (
                  <span className="font-medium">{order.tracking_number}</span>
                )}
              </p>
            </div>
          )}

          <Button asChild className="mt-8">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify full shopping flow end-to-end**

```bash
npm run dev
```

1. Browse products at /products
2. Click a product → product detail page
3. Add to cart → cart icon updates
4. Go to /cart → see items, adjust quantity
5. Click "Proceed to Checkout" → fill form
6. Submit → redirected to order confirmation page with order details

- [ ] **Step 3: Commit**

```bash
git add app/order/
git commit -m "feat: add order confirmation page"
```

---

### Task 10: Final Verification + README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Create README**

```markdown
# Stadian Storefront

A Next.js storefront template that connects to the Stadian platform. Fork this repo, add your API key, and deploy your store.

## Quick Start

1. Clone this repo
2. Copy `.env.local.example` to `.env.local` and add your API key
3. `npm install`
4. `npm run dev`
5. Open http://localhost:3000

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STADIAN_API_KEY` | Yes | Your storefront API key from the Stadian dashboard |
| `STADIAN_API_URL` | Yes | Your Stadian API URL |

## Customization

This is your Next.js app — customize it however you want:

- **Styling:** Edit `tailwind.config.ts` and component styles
- **Branding:** Configure colors, logo, and store name in your Stadian dashboard, or edit components directly
- **Pages:** Add, remove, or modify any page in the `app/` directory
- **Payments:** Replace the payment instructions section in the checkout with your preferred payment provider

## Deploy

Deploy to Vercel, Netlify, or any platform that supports Next.js.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

- [ ] **Step 4: Final commit with build verification**

```bash
npm run build && git add -A && git status
```

If there are any remaining unstaged files, review and commit as appropriate.

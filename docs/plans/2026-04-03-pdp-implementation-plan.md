# PDP Implementation Plan — Stadian Storefront
**Date:** 2026-04-03
**Based on:** Competitor analysis + Expert CRO research (Baymard, NN/g, CXL, Google web.dev)

---

## Current State

Already implemented:
- Two-column layout (image left, info right)
- Breadcrumb navigation
- Category links with color
- Group name as title + variant subtitle
- Purity/cold chain/age verification/CAS badges
- Price display with compare-at strikethrough
- Volume pricing pills
- Form + Dosage variant selectors (button-group pattern)
- Add to Cart with quantity selector
- Product description
- Key highlights (checklist grid)
- Storage & handling section
- Mechanism of action
- FAQs
- Meta badges (form type, tax, research cycle)
- Sticky image on desktop scroll
- JSON-LD structured data

---

## Phase 1: High-Impact Conversion Boosters
*Expected combined lift: +30-60% conversion*

### 1.1 Trust Signals Row Below CTA (+32% conversion — Envive)
Add a horizontal row of 3-4 trust indicators immediately below the Add to Cart button:
- Shield icon: "Third-Party Tested" or purity percentage
- Truck icon: "Free Shipping Over $100"
- Lock icon: "Secure Checkout"
- Return icon: "30-Day Guarantee"

Small icons + short text, single line, muted styling. NOT cards — just inline icons.

**Files:** `src/app/products/[slug]/page.tsx`

### 1.2 Sticky Mobile CTA Bar (+8-25% conversion — GrowthRock, CRE)
Persistent bottom bar on mobile that appears when the original Add to Cart scrolls out of view:
- Shows product name (truncated), price, and "Add to Cart" button
- Semi-transparent background with blur
- Slides up on scroll

**Files:** New `src/app/products/[slug]/sticky-cart-bar.tsx` (client component)

### 1.3 Cart Drawer / Side Cart (reduces friction — all top competitors use this)
When "Add to Cart" is clicked, open a slide-out drawer from the right showing cart contents instead of just a brief "Added!" flash. Include:
- Item just added (highlighted)
- Cart total
- "Continue Shopping" + "Checkout" buttons
- NN/g research: inadequate add-to-cart feedback is a major conversion barrier

**Files:** New `src/components/cart/cart-drawer.tsx`, update `src/providers/cart-provider.tsx`

### 1.4 Shipping Info on PDP (+88% order completion — Intelligems)
Add shipping estimate below trust signals:
- "Ships same day if ordered by 2pm EST" (with countdown if applicable)
- "Free shipping on orders over $100"
- If product requires cold chain: "Ships with cold packs"

**Files:** `src/app/products/[slug]/page.tsx` or new `src/components/products/shipping-info.tsx`

---

## Phase 2: Content & Social Proof
*Expected combined lift: +40-100% conversion*

### 2.1 Review System (+270% conversion with 5+ reviews — Landbase)
This is the single highest-impact missing feature. Implement:
- Star rating + review count near the title (above the fold)
- Star distribution bar (5-star breakdown)
- Individual reviews with verified buyer badges
- Sort/filter reviews (newest, highest, lowest)
- "Write a Review" CTA
- Allow filtering by 1-star (counterintuitively +85.7% lift — Envive)

**Backend:** Needs review endpoints in CRM API
**Files:** New `src/components/reviews/` directory

### 2.2 Related Products / Frequently Bought Together (+4.5x with recommendations — ConvertCart)
Below-the-fold section:
- "Frequently Bought Together" with 2-3 complementary products + combined price + "Add Bundle" CTA
- "You May Also Like" horizontal scroll of 4-6 products
- Show price, image, rating in each tile (Baymard: 68% of sites lack sufficient detail in cross-sells)

**Files:** New sections at bottom of product page, new components

### 2.3 FAQ Accordions (current FAQs are flat — 27% miss tabbed content, accordions better)
Convert the current flat FAQ list into expandable accordions. Only show question text, expand to reveal answer on click. This saves vertical space and lets users scan questions quickly.

**Files:** `src/app/products/[slug]/page.tsx` — use shadcn Accordion component

### 2.4 Short Description Above the Fold
The `short_description` field exists but isn't shown. Add a concise 1-2 sentence description between the title and price — the hook that captures attention. Keep the full description below the fold.

**Files:** `src/app/products/[slug]/page.tsx`

---

## Phase 3: Image & Media
*Expected lift: +23-84% conversion*

### 3.1 Product Image Gallery (4-6 images +23% — ConvertCart)
Replace single image with a thumbnail gallery:
- Main image with zoom on hover (desktop) / pinch-to-zoom (mobile)
- Thumbnail strip below (never truncate — Baymard: 50-80% miss hidden thumbnails)
- Support multiple product images when available
- Include COA document image as a gallery item

**Files:** New `src/components/products/image-gallery.tsx`

### 3.2 Product Video Support (+65-84% — Invesp, Xictron)
If product has video content:
- Show video as a gallery item with play button overlay
- Autoplay muted in gallery as an option
- Keep videos short (30-90 seconds)

**Backend:** Needs video URL field on products

---

## Phase 4: Advanced Optimization
*Ongoing conversion optimization*

### 4.1 Express Checkout Buttons (+20% — ConvertCart)
Apple Pay / Google Pay / Shop Pay buttons above or alongside Add to Cart for one-tap purchase.

### 4.2 Save for Later / Wishlist
Heart icon on product page and product cards. Requires auth. Low priority but increases return visits.

### 4.3 Recently Viewed Products
Horizontal scroll at bottom of page showing products the user browsed in this session. Stored in localStorage.

### 4.4 Announcement Bar
Sticky banner at top of site with current promotion:
- "Free Shipping on Orders Over $100"
- "Same-Day Shipping — Order by 2pm EST"
- Dismissible, stored in sessionStorage

### 4.5 A/B Testing Infrastructure
Set up Vercel Flags or similar for testing:
- CTA button text ("Add to Cart" vs "Buy Now" vs "Add to Bag")
- Trust signal placement
- Price display format
- Layout variations

### 4.6 Back-in-Stock Notifications
For out-of-stock products, show "Notify When Available" email capture instead of disabled button. Retains 10-15% of would-be-lost traffic.

---

## Priority Order (by data-backed impact)

| # | Feature | Expected Lift | Effort | Phase |
|---|---------|--------------|--------|-------|
| 1 | Review system | +270% (with 5+ reviews) | Large | 2 |
| 2 | Sticky mobile CTA | +8-25% | Small | 1 |
| 3 | Trust signals row | +32% | Small | 1 |
| 4 | Shipping info on PDP | +88% order completion | Small | 1 |
| 5 | Cart drawer | Reduces abandonment | Medium | 1 |
| 6 | Image gallery with zoom | +23-33% | Medium | 3 |
| 7 | Short description above fold | Improves scanning | Tiny | 2 |
| 8 | FAQ accordions | Better UX, saves space | Small | 2 |
| 9 | Related products | +4.5x with interaction | Medium | 2 |
| 10 | Product video | +65-84% | Medium (needs content) | 3 |

---

## What NOT to Do (Research-backed anti-patterns)

- **No social sharing buttons** — removing them increased ATC by 11.9% (CXL)
- **No autoplay carousels** on PDP — causes decision hesitation (ConvertCart)
- **No tabs for essential content** — 27% never click tabs; use accordions (ConvertCart)
- **No dropdowns for 2-5 variant options** — 70% of sites get this wrong (Baymard) — we already use buttons
- **No "Sold Out" without action** — always offer "Notify When Available"
- **No required account creation** before purchase
- **No pop-ups** that are hard to close on mobile

# Stadian Storefront

A Next.js storefront template powered by the Stadian platform. Clone it, add your API key, and deploy your store.

## Quick Start

1. Clone this repo
2. Copy `.env.local.example` to `.env.local` and fill in your values
3. `npm install`
4. `npm run dev`
5. Open http://localhost:3003

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STADIAN_API_KEY` | Yes | Your storefront API key from the Stadian dashboard |
| `STADIAN_API_URL` | Yes | Your Stadian API base URL |
| `STADIAN_WEBHOOK_SECRET` | Yes | Secret for verifying webhook signatures |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your store's public URL (used for SEO and metadata) |

## Features

- Product catalog with search, filtering, and pagination
- Product detail pages with image galleries, variants, volume pricing, reviews, and trust signals
- Shopping cart with quantity management and promo codes
- Checkout with payment processing (NMI, Authorize.net), stored payment methods, and manual payment fallback
- Customer authentication (login, register, forgot password, reset password, email verification)
- Order history and tracking
- Account management with profile editing and password change
- Telehealth intake forms with dynamic fields and status tracking
- Affiliate program with dashboard, commissions, and payouts
- SEO optimized (sitemap, robots.txt, Open Graph tags, JSON-LD structured data)
- API-driven branding (colors, logo, store name from your dashboard)
- Dark mode support
- Mobile responsive with hamburger navigation
- Webhook integration for real-time cache updates

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with featured products |
| `/products` | Product catalog |
| `/products/[slug]` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Checkout with payment |
| `/login` | Customer sign in |
| `/register` | Create account |
| `/forgot-password` | Password reset request |
| `/reset-password` | Complete password reset |
| `/verify-email` | Email verification |
| `/account` | Account dashboard |
| `/account/orders` | Order history |
| `/account/orders/[id]` | Order details |
| `/account/settings` | Profile & password |
| `/account/affiliate` | Affiliate dashboard |
| `/account/affiliate/payouts` | Payout history |
| `/account/intake/[id]` | Intake submission status |
| `/intake/[productId]` | Intake form |
| `/about` | About us |
| `/faq` | FAQ |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/returns` | Return policy |

## Customization

**Theming:** Edit CSS variables in `src/app/globals.css` or modify shadcn/ui components in `src/components/ui/`.

**Branding:** Colors, logo, and store name are pulled from your Stadian dashboard automatically. Override by editing components directly.

**Pages:** Add, remove, or modify any page in `src/app/`. This is your Next.js app — customize however you want.

**Payments:** Payment processing is handled via the Stadian payment gateway plugin. Configure your NMI or Authorize.net credentials in the Stadian dashboard.

## Tech Stack

- [Next.js 16](https://nextjs.org/) — React framework
- [React 19](https://react.dev/) — UI library
- [shadcn/ui](https://ui.shadcn.com/) — Component library
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [@stadian/storefront-sdk](https://github.com/stadian/peptide-platform) — Stadian API client

## SDK

The storefront uses `@stadian/storefront-sdk` to communicate with the Stadian API. The SDK handles authentication, request signing, and provides typed methods for all storefront endpoints.

The SDK can also be used independently to build custom storefronts or integrations. Install with:

```bash
npm install @stadian/storefront-sdk
```

## Deploy

Deploy to any platform that supports Next.js — Vercel, Netlify, or self-hosted.

### Vercel

1. Fork this repo
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add your environment variables (`STADIAN_API_KEY`, `STADIAN_API_URL`, `STADIAN_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`)
4. Deploy

## License

MIT

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

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with featured products |
| `/products` | Product catalog with search and pagination |
| `/products/[slug]` | Product detail with add-to-cart |
| `/cart` | Shopping cart with quantity management |
| `/checkout` | Checkout with shipping and order placement |
| `/order/[id]` | Order confirmation |

## Customization

This is your Next.js app — customize it however you want:

- **Theme:** Edit the shadcn/ui CSS variables in `src/app/globals.css` or modify individual components in `src/components/ui/`
- **Branding:** Configure colors, logo, and store name in your Stadian dashboard, or edit components directly
- **Pages:** Add, remove, or modify any page in `src/app/`
- **Components:** All shadcn/ui components are in `src/components/ui/` — fully yours to restyle
- **Payments:** Replace the payment instructions section in checkout with your preferred payment provider

## Tech Stack

- [Next.js 16](https://nextjs.org/) — React framework
- [shadcn/ui](https://ui.shadcn.com/) — Component library
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [@stadian/storefront-sdk](https://github.com/stadian/peptide-platform) — API client

## Deploy

Deploy to [Vercel](https://vercel.com), Netlify, or any platform that supports Next.js.

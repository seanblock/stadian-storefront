import Link from "next/link";
import type { StorefrontBranding, StorefrontProduct } from "@stadian/storefront-sdk";

interface HeroProps {
  branding: StorefrontBranding;
  featuredImage?: StorefrontProduct | null;
}

// Drop a JPG/PNG named `hero.jpg` in /public to set the hero background.
// 1920×1080 or wider works best. The headline overlays the LEFT half;
// keep the product on the RIGHT half of the image.
const HERO_BACKGROUND_URL = "/hero.jpg";

// Brand palette is fixed for the hero — navy + gold (matches the hero
// image background). The rest of the site still responds to the light/dark
// theme toggle.
const BLACK = "#0a1a2e";
const CREAM = "#f3ead5";
const CREAM_DIM = "#b8b0a0";
const GOLD = "#d4a951";

const TRUST_CHIPS = [
  "Sealed in-house",
  "Batch-numbered vials",
  "Cold-chain shipped",
  "Free shipping over $100",
] as const;

export function Hero({ branding: _branding }: HeroProps) {
  return (
    <section
      className="relative isolate -mt-20 overflow-hidden pt-20 sm:-mt-[5.5rem] sm:pt-[5.5rem]"
      style={{ backgroundColor: BLACK, color: CREAM }}
    >
      {/* Background image — anchored right so the product sits on the right
          half regardless of viewport width. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url("${HERO_BACKGROUND_URL}")`,
          backgroundPosition: "right center",
        }}
      />
      {/* Left-side dark gradient overlay — keeps headline readable
          regardless of what's in the image. Product sits on the right. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(10,26,46,0.96) 0%, rgba(10,26,46,0.88) 35%, rgba(10,26,46,0.5) 55%, rgba(10,26,46,0.12) 75%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[30rem] flex-col justify-center py-20 sm:min-h-[34rem] sm:py-24 lg:min-h-[38rem] lg:py-28">
          <div className="max-w-2xl">
            <p
              className="reveal-up text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{ color: GOLD }}
            >
              Research-grade peptides · Est. 2026
            </p>

            <h1
              className="reveal-up mt-4 text-balance text-[clamp(2.5rem,5.4vw,4.5rem)] font-black uppercase leading-[0.98] tracking-[-0.02em]"
              style={{ color: CREAM, animationDelay: "80ms" }}
            >
              Precision peptides for{" "}
              <span style={{ color: GOLD }}>serious research</span>
            </h1>

            <p
              className="reveal-up mt-6 max-w-lg text-balance text-base leading-relaxed sm:text-lg"
              style={{ color: CREAM_DIM, animationDelay: "160ms" }}
            >
              High-purity compounds for laboratory research — sealed in-house
              with batch-numbered labeling and shipped in temperature-controlled
              packaging. Strictly for research use.
            </p>

            <div
              className="reveal-up mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href="/products"
                className="group inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.22em] transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  background: GOLD,
                  color: BLACK,
                  boxShadow: `0 20px 50px -20px ${GOLD}88`,
                }}
              >
                <span>Shop compounds</span>
                <svg
                  className="size-4 transition-transform duration-500 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border px-7 py-4 text-sm font-medium uppercase tracking-[0.22em] transition-colors duration-300 hover:border-current"
                style={{ borderColor: `${CREAM}30`, color: CREAM }}
              >
                Our story
              </Link>
            </div>

            {/* Trust chips — concrete operational claims at the decision point */}
            <ul
              className="reveal-up mt-10 flex max-w-xl flex-wrap gap-x-6 gap-y-2.5"
              style={{ animationDelay: "320ms" }}
            >
              {TRUST_CHIPS.map((chip) => (
                <li
                  key={chip}
                  className="flex items-center gap-2 text-[13px] font-medium"
                  style={{ color: `${CREAM}dd` }}
                >
                  <svg
                    className="size-3.5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={GOLD}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {chip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom hairline */}
      <div
        aria-hidden
        className="relative z-10 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${GOLD}50, transparent)`,
        }}
      />
    </section>
  );
}

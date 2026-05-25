import Link from "next/link";
import Image from "next/image";
import type { StorefrontBranding, StorefrontProduct } from "@stadian/storefront-sdk";

interface HeroProps {
  branding: StorefrontBranding;
  featuredImage?: StorefrontProduct | null;
}

// Drop a JPG/PNG named `hero.jpg` in /public to set the hero background.
// 1920×1080 or wider works best. The headline overlays the RIGHT half;
// keep the product on the LEFT half of the image.
const HERO_BACKGROUND_URL = "/hero.jpg";

// Brand palette is fixed for the hero — navy + gold (matches the hero
// image background). The rest of the site still responds to the light/dark
// theme toggle.
const BLACK = "#0a1a2e";
const BLACK_SOFT = "#06121f";
const CREAM = "#f3ead5";
const CREAM_DIM = "#b8b0a0";
const GOLD = "#d4a951";
const GOLD_DEEP = "#9a7a3a";

export function Hero({ branding: _branding, featuredImage }: HeroProps) {
  const product = featuredImage ?? null;

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
            "linear-gradient(to right, rgba(10,26,46,0.95) 0%, rgba(10,26,46,0.85) 35%, rgba(10,26,46,0.45) 55%, rgba(10,26,46,0.10) 75%, transparent 100%)",
        }}
      />

      {/* MAIN HERO — left-aligned (product sits on right of image) */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[28rem] flex-col justify-center py-20 sm:min-h-[32rem] sm:py-24 lg:min-h-[36rem] lg:py-28">
          <div className="max-w-xl">
            <h1
              className="reveal-up text-balance text-[clamp(2.25rem,5.2vw,4.25rem)] font-black uppercase leading-[0.96] tracking-[-0.02em]"
              style={{ color: CREAM }}
            >
              Precision peptides for{" "}
              <span style={{ color: GOLD }}>research</span> excellence
            </h1>

            <p
              className="reveal-up mt-6 max-w-lg text-balance text-base leading-relaxed sm:text-lg"
              style={{ color: CREAM_DIM, animationDelay: "120ms" }}
            >
              High-purity compounds for laboratory research — strictly research
              use only. Independently tested, sealed in-house, cold-chain
              shipped.
            </p>

            <div
              className="reveal-up mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "220ms" }}
            >
              <Link
                href="/products"
                className="group inline-flex items-center gap-3 rounded-full px-8 py-3.5 text-sm font-bold uppercase tracking-[0.22em] transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  background: GOLD,
                  color: BLACK,
                  boxShadow: `0 20px 50px -20px ${GOLD}88`,
                }}
              >
                <span>Shop now</span>
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
                className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-medium uppercase tracking-[0.22em] transition-colors duration-300"
                style={{ borderColor: `${CREAM}25`, color: CREAM }}
              >
                How we test
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM INFO RAIL */}
      <InfoRail product={product} />
    </section>
  );
}

function InfoRail({ product }: { product: StorefrontProduct | null }) {
  return (
    <div
      className="relative z-10 border-t"
      style={{ borderColor: `${GOLD}22` }}
    >
      <div
        className="mx-auto grid max-w-7xl grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        style={{ borderColor: `${CREAM}12` }}
      >
        {/* PANEL 1 — Personal Assessment */}
        <Link
          href="/products"
          className="group relative flex items-center gap-4 overflow-hidden px-5 py-5 sm:px-7 sm:py-6"
          style={{ background: CREAM }}
        >
          <span
            className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{ background: BLACK_SOFT }}
          >
            {product?.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            ) : (
              <ThumbVial />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[13px] font-medium leading-snug"
              style={{ color: BLACK }}
            >
              Start your personalized path to research-grade peptides.
            </p>
            <span
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] underline-offset-4 group-hover:underline"
              style={{ color: BLACK }}
            >
              Personal assessment
              <svg
                className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </span>
          </div>
        </Link>

        {/* PANEL 2 — Newly enhanced formula */}
        <div
          className="relative flex items-center gap-4 px-5 py-5 sm:px-7 sm:py-6"
          style={{ background: CREAM }}
        >
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-full"
            style={{ background: BLACK_SOFT }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={GOLD}
              strokeWidth="1.5"
              className="size-5"
            >
              <path d="M9 3h6l-1 4h-4L9 3z" />
              <path d="M10 7v3l-3 7a3 3 0 003 4h4a3 3 0 003-4l-3-7V7" />
              <path d="M9 14h6" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[13px] font-medium leading-snug"
              style={{ color: BLACK }}
            >
              Experience our newly enhanced, batch-traceable formulations.
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-0.5 transition-all"
                  style={{
                    width: i === 0 ? "20px" : "10px",
                    background: i === 0 ? BLACK : `${BLACK}33`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* PANEL 3 — Social proof */}
        <div
          className="relative flex items-center gap-4 px-5 py-5 sm:px-7 sm:py-6"
          style={{ background: BLACK_SOFT }}
        >
          <div className="flex shrink-0 -space-x-3">
            <Avatar gradient="linear-gradient(135deg, #d4a951, #8a6422)" initial="JM" />
            <Avatar gradient="linear-gradient(135deg, #6a8db8, #2c4a73)" initial="SK" />
            <Avatar gradient="linear-gradient(135deg, #c97f5a, #6b3920)" initial="RT" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-2xl font-black tracking-tight"
              style={{ color: GOLD }}
            >
              +5K
            </p>
            <p
              className="mt-1 text-[12px] leading-snug"
              style={{ color: `${CREAM}cc` }}
            >
              Researchers have already optimized their bench supply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ gradient, initial }: { gradient: string; initial: string }) {
  return (
    <span
      className="flex size-10 items-center justify-center rounded-full border-2 text-[10px] font-bold"
      style={{
        background: gradient,
        borderColor: BLACK_SOFT,
        color: CREAM,
      }}
    >
      {initial}
    </span>
  );
}

function ThumbVial() {
  // Simple realistic vial: aluminum cap, navy label, white powder hint.
  return (
    <svg viewBox="0 0 40 60" className="size-10">
      <rect x="15" y="4" width="10" height="1.5" fill="#1a1a20" />
      <rect x="13" y="5.5" width="14" height="6" fill="#d2d2da" />
      <rect x="13" y="7" width="14" height="0.4" fill="#7a7a82" opacity="0.6" />
      <rect x="13" y="9" width="14" height="0.4" fill="#7a7a82" opacity="0.6" />
      <rect x="11" y="11.5" width="18" height="2" fill="#9a9aa3" />
      <path
        d="M 12 13.5 L 11 16 L 11 50 Q 11 55 20 55 Q 29 55 29 50 L 29 16 L 28 13.5 Z"
        fill="#2c4a73"
        opacity="0.35"
      />
      <path
        d="M 12 32 L 11 32 L 11 50 Q 11 54.5 20 54.5 Q 29 54.5 29 50 L 29 32 Z"
        fill="#ededdf"
      />
      <rect x="12" y="36" width="16" height="14" fill="#0a1a2e" />
      <rect x="12" y="36" width="16" height="0.4" fill="#d4a951" />
      <rect x="12" y="49.6" width="16" height="0.4" fill="#d4a951" />
      <text
        x="20"
        y="44"
        textAnchor="middle"
        fontSize="5"
        fontWeight="900"
        fontFamily="-apple-system, sans-serif"
        fill="#f3ead5"
      >
        BPC
      </text>
    </svg>
  );
}

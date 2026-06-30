import Image from "next/image";
import type { StorefrontBranding } from "@stadian/storefront-sdk";

type Reason = StorefrontBranding["storefront_closed_reason"];

// The brand's surface is a deep navy (its color tokens are the gold accent).
const NAVY_BG =
  "radial-gradient(120% 90% at 50% -10%, #1a2747 0%, #0e1730 52%, #0a1124 100%)";
const CREAM = "#F5F1E6";

const COPY: Record<"general" | "coming_soon" | "maintenance", { heading: string; body: string }> = {
  general: { heading: "This store is currently closed.", body: "Please check back soon." },
  coming_soon: {
    heading: "Coming soon.",
    body: "We're putting the finishing touches on our store. Check back soon.",
  },
  maintenance: {
    heading: "Closed for maintenance.",
    body: "We'll be back shortly. Thanks for your patience.",
  },
};

export function copyFor(reason: Reason) {
  return COPY[(reason ?? "general") as keyof typeof COPY] ?? COPY.general;
}

export function StoreClosed({
  reason,
  branding,
}: {
  reason: Reason;
  branding: StorefrontBranding;
}) {
  const { heading, body } = copyFor(reason);
  const storeName = branding.store_name ?? "Store";
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center"
      style={{ background: NAVY_BG, color: CREAM }}
    >
      {/* Branded ambient backdrop — a faint gold glow over the navy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 30%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 72%)",
        }}
      />

      <div className="flex w-full max-w-lg flex-col items-center gap-7">
        <div className="flex flex-col items-center gap-3">
          {branding.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt={storeName} className="h-20 w-auto" />
          ) : (
            <Image
              src="/logo.png"
              alt={storeName}
              width={96}
              height={96}
              priority
              className="size-20 object-contain"
            />
          )}
          <span className="text-sm font-semibold uppercase tracking-[0.28em]">{storeName}</span>
        </div>

        {branding.tagline ? (
          <p
            className="-mt-2 text-[0.7rem] uppercase tracking-[0.32em]"
            style={{ color: "color-mix(in srgb, " + CREAM + " 55%, transparent)" }}
          >
            {branding.tagline}
          </p>
        ) : null}

        <div className="flex flex-col items-center gap-5">
          <span
            aria-hidden
            className="h-px w-14"
            style={{ background: "color-mix(in srgb, var(--color-accent) 80%, transparent)" }}
          />
          <h1 className="font-serif text-5xl leading-tight sm:text-6xl">{heading}</h1>
          <p
            className="max-w-md text-base leading-relaxed"
            style={{ color: "color-mix(in srgb, " + CREAM + " 70%, transparent)" }}
          >
            {body}
          </p>
        </div>

        {branding.footer_text ? (
          <p
            className="mt-4 text-xs"
            style={{ color: "color-mix(in srgb, " + CREAM + " 45%, transparent)" }}
          >
            {branding.footer_text}
          </p>
        ) : null}
      </div>
    </main>
  );
}

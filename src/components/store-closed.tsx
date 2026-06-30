import Image from "next/image";
import type { StorefrontBranding } from "@stadian/storefront-sdk";

type Reason = StorefrontBranding["storefront_closed_reason"];

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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      {/* Branded ambient backdrop — driven by the tenant's accent/primary tokens. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 32%, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent 72%)," +
            "radial-gradient(45% 38% at 50% 102%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 70%)",
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
          <p className="-mt-2 text-[0.7rem] uppercase tracking-[0.32em] text-muted-foreground">
            {branding.tagline}
          </p>
        ) : null}

        <div className="flex flex-col items-center gap-5">
          <span
            aria-hidden
            className="h-px w-14"
            style={{ background: "color-mix(in srgb, var(--color-accent) 70%, transparent)" }}
          />
          <h1 className="font-serif text-5xl leading-tight sm:text-6xl">{heading}</h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">{body}</p>
        </div>

        {branding.footer_text ? (
          <p className="mt-4 text-xs text-muted-foreground/70">{branding.footer_text}</p>
        ) : null}
      </div>
    </main>
  );
}

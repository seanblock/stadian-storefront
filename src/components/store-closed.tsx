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
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-6 text-center">
      {branding.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={branding.logo_url} alt={branding.store_name ?? "Store"} className="mb-2 h-16 w-auto" />
      ) : (
        <p className="text-xl font-semibold">{branding.store_name ?? "Store"}</p>
      )}
      <h1 className="font-serif text-4xl">{heading}</h1>
      <p className="max-w-md text-muted-foreground">{body}</p>
    </main>
  );
}

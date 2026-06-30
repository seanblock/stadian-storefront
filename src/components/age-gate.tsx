"use client"

import Image from "next/image"
import type { StorefrontBranding } from "@stadian/storefront-sdk"

export interface AgeGateProps {
  minAge: number
  declineUrl?: string | null
  branding: StorefrontBranding
  onConfirm?: () => void
}

// The brand's surface is a deep navy (its color tokens are the gold accent).
const NAVY_BG =
  "radial-gradient(120% 100% at 50% -8%, #1a2747 0%, #0e1730 55%, #0a1124 100%)"
const CREAM = "#F5F1E6"

export function AgeGate({ minAge, declineUrl, branding, onConfirm }: AgeGateProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      // Non-dismissible — eat the Escape key so the gate cannot be dismissed
      e.preventDefault()
    }
  }

  function handleConfirm() {
    document.cookie = `age_confirmed=1; path=/; max-age=31536000; SameSite=Lax`
    if (onConfirm) {
      onConfirm()
    } else {
      window.location.reload()
    }
  }

  function handleDecline() {
    window.location.href = declineUrl || "https://www.google.com"
  }

  const storeName = branding.store_name ?? "This store"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-heading"
      aria-describedby="age-gate-description"
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      onKeyDown={handleKeyDown}
    >
      {/* Dimmed, blurred backdrop */}
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Navy card */}
      <div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl px-8 py-10 text-center shadow-2xl ring-1"
        style={{
          background: NAVY_BG,
          color: CREAM,
          ["--tw-ring-color" as string]: "color-mix(in srgb, var(--color-accent) 30%, transparent)",
        }}
      >
        {/* Logo + wordmark — same treatment as the closed-store page */}
        <div className="flex flex-col items-center gap-2.5">
          {branding.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt={storeName} className="h-14 w-auto" />
          ) : (
            <Image
              src="/logo.png"
              alt={storeName}
              width={64}
              height={64}
              priority
              className="size-14 object-contain"
            />
          )}
          <span className="text-xs font-semibold uppercase tracking-[0.28em]">{storeName}</span>
        </div>

        {/* Accent divider — the signature element shared with the closed page */}
        <span
          aria-hidden
          className="h-px w-12"
          style={{ background: "color-mix(in srgb, var(--color-accent) 80%, transparent)" }}
        />

        <div className="flex flex-col items-center gap-3">
          <span
            className="text-[0.65rem] font-medium uppercase tracking-[0.32em]"
            style={{ color: "color-mix(in srgb, " + CREAM + " 55%, transparent)" }}
          >
            Age verification
          </span>
          {/* The age numeral is the one bold moment — gold on navy reads with high contrast. */}
          <h1 id="age-gate-heading" className="font-serif text-3xl leading-tight sm:text-4xl">
            You must be{" "}
            <span style={{ color: "var(--color-accent)" }}>{minAge}</span> or older to enter
          </h1>
          <p
            id="age-gate-description"
            className="max-w-xs text-sm leading-relaxed"
            style={{ color: "color-mix(in srgb, " + CREAM + " 70%, transparent)" }}
          >
            {storeName} sells research products restricted by age. Please confirm your age to continue.
          </p>
        </div>

        {/* Actions — gold confirm dominates; leaving is the quiet escape. */}
        <div className="mt-1 flex w-full flex-col items-center gap-3">
          {/* autoFocus moves initial keyboard focus to the primary action */}
          <button
            autoFocus
            onClick={handleConfirm}
            className="w-full rounded-md px-5 py-3 text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: "var(--color-accent)", color: "#0e1730", outlineColor: CREAM }}
          >
            I am {minAge} or older
          </button>
          <button
            onClick={handleDecline}
            className="rounded px-3 py-1 text-sm underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "color-mix(in srgb, " + CREAM + " 55%, transparent)", outlineColor: CREAM }}
          >
            I&rsquo;m under {minAge} — leave
          </button>
        </div>
      </div>
    </div>
  )
}

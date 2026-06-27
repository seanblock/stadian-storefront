"use client"

import type { StorefrontBranding } from "@stadian/storefront-sdk"
import { Button } from "@/components/ui/button"

export interface AgeGateProps {
  minAge: number
  declineUrl?: string | null
  branding: StorefrontBranding
  onConfirm?: () => void
}

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
    // Full-screen overlay — fixed, covers everything, not dismissible via backdrop click
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-heading"
      aria-describedby="age-gate-description"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
      onKeyDown={handleKeyDown}
    >
      {/* Card */}
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl bg-background p-8 text-center shadow-2xl">
        {/* Branding */}
        {branding.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logo_url}
            alt={branding.store_name ?? "Store"}
            className="mb-2 h-16 w-auto"
          />
        ) : (
          <p className="text-xl font-semibold">{branding.store_name ?? "Store"}</p>
        )}

        {/* Heading */}
        <h1 id="age-gate-heading" className="font-serif text-3xl">
          You must be {minAge} or older to enter
        </h1>

        {/* Body */}
        <p id="age-gate-description" className="max-w-sm text-muted-foreground">
          {storeName} sells research products restricted by age. Please confirm your age to
          continue.
        </p>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {/* autoFocus moves initial keyboard focus to the primary action */}
          <Button
            autoFocus
            size="lg"
            onClick={handleConfirm}
          >
            I am {minAge} or older
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleDecline}
          >
            Leave
          </Button>
        </div>
      </div>
    </div>
  )
}

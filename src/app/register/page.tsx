import type { Metadata } from "next";
import Link from "next/link";
import { getBranding } from "@/lib/branding";
import { registrationShapeFor } from "@/lib/pricing-access";
import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create Account",
};

const INVITE_POINTS = [
  "Accounts are opened for verified businesses only",
  "Wholesale pricing is shown once you're signed in",
  "Batch numbers and lab documentation with every order",
  "Sealed in-house, cold-chain where it counts",
] as const;

export default async function RegisterPage() {
  const branding = await getBranding();
  const { inviteOnly, requiresApproval, isWholesale } =
    registrationShapeFor(branding);

  if (inviteOnly) {
    return (
      <AuthShell
        eyebrow="By invitation"
        headline={<>Accounts are opened by invitation</>}
        blurb={`${branding.store_name || "This store"} sells to approved businesses only.`}
        points={INVITE_POINTS}
      >
        <div className="rounded-2xl border border-border p-7 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Already invited?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Check your email for your account setup link, then sign in to see
            pricing and place orders.
          </p>

          {/* Server Component — `buttonVariants()` is client-only, so the link
              carries its own styles. */}
          <Link
            href="/login"
            className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-[11.5px] font-bold uppercase tracking-[0.22em] text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5"
          >
            Sign in
          </Link>

          <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            Not set up yet? Get in touch and we&apos;ll open your account.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <RegisterForm
      requiresApproval={requiresApproval}
      isWholesale={isWholesale}
      taxExemptionsEnabled={branding.tax_exemptions_enabled === true}
    />
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, FieldGroupHeading } from "@/components/layout/auth-shell";

interface RegisterFormProps {
  /** Store vets applicants: the account is created but can't sign in yet. */
  requiresApproval: boolean;
  /** Store sells to businesses: collect the company details. */
  isWholesale: boolean;
}

// Inputs ship at h-8 for dense admin-style forms. A page asking a stranger for
// their name, phone and password needs room to breathe or it reads as sketchy.
const FIELD = "h-11 rounded-lg px-3.5 text-[15px]";
const FIELD_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/70";
const OPTIONAL = "font-normal normal-case tracking-normal text-muted-foreground";
const SUBMIT =
  "h-12 w-full rounded-full text-[11.5px] font-bold uppercase tracking-[0.22em] transition-transform duration-300 hover:-translate-y-0.5 disabled:hover:translate-y-0";

const WHOLESALE_POINTS = [
  "Wholesale pricing unlocks the moment your account is approved",
  "Batch numbers and lab documentation with every order",
  "Sealed in-house, cold-chain where it counts",
  "Reorder in a click from your account history",
] as const;

const RETAIL_POINTS = [
  "Third-party tested, batch-numbered inventory",
  "Sealed in-house before it leaves our door",
  "Free shipping on orders over $100",
  "Track orders and reorder from your account",
] as const;

export function RegisterForm({ requiresApproval, isWholesale }: RegisterFormProps) {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyTaxId, setCompanyTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingApproval, setAwaitingApproval] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);

    try {
      const profile = await register({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        ...(isWholesale
          ? {
              customerType: "business" as const,
              companyName,
              companyWebsite: companyWebsite || undefined,
              companyTaxId: companyTaxId || undefined,
            }
          : {}),
      });

      // Approval-mode accounts can't sign in yet, so there's nowhere to send them.
      if (profile?.account_status === "pending") {
        setAwaitingApproval(true);
        return;
      }

      router.push("/account");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (awaitingApproval) {
    return (
      <AuthShell
        eyebrow="Application received"
        headline={<>We&apos;ve got your details</>}
        blurb="Every account is reviewed by hand, so nothing goes out to an unverified buyer."
        points={isWholesale ? WHOLESALE_POINTS : RETAIL_POINTS}
      >
        <div className="rounded-2xl border border-border p-7 sm:p-8">
          <span
            aria-hidden
            className="flex size-11 items-center justify-center rounded-full bg-[#0a1a2e] text-[#d4a951]"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>

          <h2 className="mt-5 text-2xl font-bold tracking-tight">
            Thanks{companyName ? `, ${companyName}` : ""}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We review new accounts by hand. We&apos;ll email{" "}
            <span className="font-medium text-foreground">{email}</span> as soon
            as yours is approved, and you can sign in and order from there.
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex h-11 items-center justify-center rounded-full border border-input px-6 text-[11.5px] font-bold uppercase tracking-[0.22em] transition-colors hover:border-foreground"
          >
            Browse the catalog
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={requiresApproval ? "Wholesale accounts" : "Create your account"}
      headline={
        requiresApproval ? (
          <>Apply for a wholesale account</>
        ) : (
          <>Order faster, track everything</>
        )
      }
      blurb={
        requiresApproval
          ? "We approve accounts one at a time. Tell us who you are and we'll get pricing in front of you."
          : "One account for your orders, addresses and reorders — nothing else, and nothing shared."
      }
      points={isWholesale ? WHOLESALE_POINTS : RETAIL_POINTS}
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {isWholesale && (
          <>
            <FieldGroupHeading>Your business</FieldGroupHeading>

            <div className="grid gap-2">
              <Label htmlFor="companyName" className={FIELD_LABEL}>
                Business name
              </Label>
              <Input
                id="companyName"
                type="text"
                required
                autoComplete="organization"
                className={FIELD}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="companyWebsite" className={FIELD_LABEL}>
                  Website <span className={OPTIONAL}>(optional)</span>
                </Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  placeholder="https://"
                  autoComplete="url"
                  className={FIELD}
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="companyTaxId" className={FIELD_LABEL}>
                  Tax ID / EIN <span className={OPTIONAL}>(optional)</span>
                </Label>
                <Input
                  id="companyTaxId"
                  type="text"
                  className={FIELD}
                  value={companyTaxId}
                  onChange={(e) => setCompanyTaxId(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <FieldGroupHeading>Your details</FieldGroupHeading>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName" className={FIELD_LABEL}>
              First name
            </Label>
            <Input
              id="firstName"
              type="text"
              required
              autoComplete="given-name"
              className={FIELD}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName" className={FIELD_LABEL}>
              Last name
            </Label>
            <Input
              id="lastName"
              type="text"
              required
              autoComplete="family-name"
              className={FIELD}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email" className={FIELD_LABEL}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className={FIELD}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone" className={FIELD_LABEL}>
            Phone <span className={OPTIONAL}>(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            className={FIELD}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <FieldGroupHeading>Password</FieldGroupHeading>

        <div className="grid gap-2">
          <Label htmlFor="password" className={FIELD_LABEL}>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="password-hint"
            className={FIELD}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmPassword" className={FIELD_LABEL}>
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className={FIELD}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={submitting} className={`mt-2 ${SUBMIT}`}>
          {submitting
            ? requiresApproval
              ? "Submitting..."
              : "Creating account..."
            : requiresApproval
              ? "Submit application"
              : "Create account"}
        </Button>

        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <svg
            aria-hidden
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Sent over an encrypted connection. Never sold or shared.
        </p>

        <p className="border-t border-border pt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

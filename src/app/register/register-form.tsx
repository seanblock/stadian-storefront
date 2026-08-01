"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterFormProps {
  /** Store vets applicants: the account is created but can't sign in yet. */
  requiresApproval: boolean;
  /** Store sells to businesses: collect the company details. */
  isWholesale: boolean;
}

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
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Application received</CardTitle>
            <CardDescription>
              Thanks{companyName ? `, ${companyName}` : ""}. We review new
              accounts by hand — we&apos;ll email {email} as soon as yours is
              approved, and you can sign in and order from there.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/products"
              className="text-sm font-medium text-primary hover:underline"
            >
              Browse the catalog
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {requiresApproval ? "Apply for an account" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {requiresApproval
              ? "Tell us about your business. We'll review your application and email you once it's approved."
              : "Enter your details to create a new account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {isWholesale && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="companyName">Business Name</Label>
                  <Input
                    id="companyName"
                    type="text"
                    required
                    autoComplete="organization"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="companyWebsite">
                    Business Website{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    placeholder="https://"
                    autoComplete="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="companyTaxId">
                    Tax ID / EIN{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="companyTaxId"
                    type="text"
                    value={companyTaxId}
                    onChange={(e) => setCompanyTaxId(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="phone">
                Phone{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting
                ? requiresApproval
                  ? "Submitting..."
                  : "Creating account..."
                : requiresApproval
                  ? "Submit application"
                  : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

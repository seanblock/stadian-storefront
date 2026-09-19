"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/layout/auth-shell";
import { Turnstile } from "@/components/turnstile";

// Matches the register form — the two pages sit either side of one link, so
// they have to feel like the same store.
const FIELD = "h-11 rounded-lg px-3.5 text-[15px]";
const FIELD_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/70";
const SUBMIT =
  "h-12 w-full rounded-full text-[11.5px] font-bold uppercase tracking-[0.22em] transition-transform duration-300 hover:-translate-y-0.5 disabled:hover:translate-y-0";

const POINTS = [
  "Your pricing, applied the moment you sign in",
  "View your order history and itemized receipts",
  "Check payment and fulfillment status",
  "Find shipment tracking when your order ships",
] as const;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  // A Turnstile token is single-use, so a rejected sign-in — the common case on
  // a login form — needs a fresh challenge before the next try.
  const [turnstileReset, setTurnstileReset] = useState(0);

  const reason = searchParams.get("reason");
  const sessionExpired = reason === "expired";
  // Set by the register page when the account was created but the automatic
  // sign-in didn't take.
  const justRegistered = reason === "registered";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const profile = await login(email, password, turnstileToken);
      // Sales reps land on their POS dashboard; an explicit ?redirect= wins
      // (that's how the proxy round-trips /rep/* through login).
      const fallback = profile.is_sales_rep ? "/rep" : "/account";
      const redirectTo = searchParams.get("redirect") || fallback;
      router.push(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password"
      );
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {sessionExpired && !error && (
        <div className="rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-muted-foreground">
          Your session expired — sign in again.
        </div>
      )}

      {justRegistered && !error && (
        <div className="rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-muted-foreground">
          Your account is ready — sign in to get started.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {error}
        </div>
      )}

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
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="password" className={FIELD_LABEL}>
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          className={FIELD}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Turnstile
        action="login"
        onToken={setTurnstileToken}
        resetKey={turnstileReset}
        className="mt-1 flex justify-center"
      />

      <Button type="submit" disabled={submitting} className={`mt-2 ${SUBMIT}`}>
        {submitting ? "Signing in..." : "Sign in"}
      </Button>

      <p className="border-t border-border pt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Account access"
      headline={<>Welcome back</>}
      blurb="Sign in to see your pricing, your order history and everything you've bought."
      points={POINTS}
    >
      <Suspense
        fallback={
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

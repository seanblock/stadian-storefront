"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/app/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type State = "loading" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(token ? "loading" : "no-token");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    verifyEmail(token)
      .then(() => {
        if (!cancelled) setState("success");
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "This verification link is invalid or has expired."
          );
          setState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const content: Record<State, { title: string; description: string; body: React.ReactNode }> = {
    loading: {
      title: "Verifying your email...",
      description: "Please wait while we verify your email address.",
      body: (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ),
    },
    success: {
      title: "Email Verified",
      description: "Your email address has been successfully verified.",
      body: (
        <div className="grid gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            Email verified! Your account is now active.
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      ),
    },
    error: {
      title: "Verification Failed",
      description: "We could not verify your email address.",
      body: (
        <div className="grid gap-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage ?? "This verification link is invalid or has expired."}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Back to Sign In
            </Link>
          </p>
        </div>
      ),
    },
    "no-token": {
      title: "Invalid Link",
      description: "This email verification link is invalid.",
      body: (
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Back to Sign In
          </Link>
        </p>
      ),
    },
  };

  const { title, description, body } = content[state];

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

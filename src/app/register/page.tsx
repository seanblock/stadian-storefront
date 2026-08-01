import type { Metadata } from "next";
import Link from "next/link";
import { getBranding } from "@/lib/branding";
import { registrationShapeFor } from "@/lib/pricing-access";
import { RegisterForm } from "./register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Server Component — `buttonVariants()` is client-only, so style the link here.
const PRIMARY_LINK =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";

export const metadata: Metadata = {
  title: "Create Account",
};

export default async function RegisterPage() {
  const branding = await getBranding();
  const { inviteOnly, requiresApproval, isWholesale } =
    registrationShapeFor(branding);

  if (inviteOnly) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Accounts are by invitation</CardTitle>
            <CardDescription>
              {branding.store_name || "This store"} sells to approved businesses
              only. Get in touch and we&apos;ll set your account up.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/login" className={PRIMARY_LINK}>
              Sign in to an existing account
            </Link>
            <p className="text-center text-sm text-muted-foreground">
              Already invited? Check your email for your account setup link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RegisterForm requiresApproval={requiresApproval} isWholesale={isWholesale} />
  );
}

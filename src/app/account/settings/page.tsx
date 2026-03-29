"use client";

import { useAuth } from "@/providers/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value || <span className="text-muted-foreground">Not provided</span>}</p>
    </div>
  );
}

export default function AccountSettingsPage() {
  const { customer } = useAuth();

  if (!customer) return null;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your personal information on file.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField label="First name" value={customer.first_name} />
            <ProfileField label="Last name" value={customer.last_name} />
          </div>

          <Separator />

          <ProfileField label="Email" value={customer.email} />
          <ProfileField label="Phone" value={customer.phone} />

          {customer.affiliate_code && (
            <>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField label="Affiliate code" value={customer.affiliate_code} />
                <ProfileField label="Affiliate status" value={customer.affiliate_status} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            Need to update your profile?{" "}
            <a
              href="mailto:support@example.com"
              className="font-medium text-primary hover:underline"
            >
              Contact support
            </a>{" "}
            and we&apos;ll take care of it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

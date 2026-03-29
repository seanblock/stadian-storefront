"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function AccountOverviewPage() {
  const { customer } = useAuth();

  if (!customer) return null;

  const displayName =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    "there";

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your orders, settings, and account details.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Email</CardDescription>
            <CardTitle className="truncate text-sm font-normal">
              {customer.email}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardDescription>Member since</CardDescription>
            <CardTitle className="text-sm font-normal">
              {formatDate(customer.created_at)}
            </CardTitle>
          </CardHeader>
        </Card>

        {customer.affiliate_code && (
          <Card size="sm">
            <CardHeader>
              <CardDescription>Affiliate status</CardDescription>
              <CardTitle className="text-sm font-normal capitalize">
                {customer.affiliate_status || "Active"}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>View your order history.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm">
              <Link href="/account/orders">View orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your profile details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm">
              <Link href="/account/settings">View settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

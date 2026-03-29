"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/cart-provider";
import { OrderSummary } from "@/components/cart/order-summary";
import { createOrder } from "@/app/actions/checkout";
import { getSessionId, clearSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!cart || cart.items.length === 0)) {
      router.push("/cart");
    }
  }, [loading, cart, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const sessionId = getSessionId();
      const order = await createOrder(sessionId, {
        customerEmail: data.get("email") as string,
        shippingAddress: {
          line1: data.get("line1") as string,
          line2: (data.get("line2") as string) || undefined,
          city: data.get("city") as string,
          state: data.get("state") as string,
          zip: data.get("zip") as string,
          country: data.get("country") as string,
        },
        notes: (data.get("notes") as string) || undefined,
      });
      clearSession();
      router.push(`/order/${order.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to place order. Please try again."
      );
      setSubmitting(false);
    }
  }

  if (loading || !cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left column — form sections */}
          <div className="flex flex-col gap-6">
            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="line1">Address line 1</Label>
                  <Input
                    id="line1"
                    name="line1"
                    type="text"
                    placeholder="123 Main St"
                    required
                    autoComplete="address-line1"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="line2">
                    Address line 2{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="line2"
                    name="line2"
                    type="text"
                    placeholder="Apt, suite, unit, etc."
                    autoComplete="address-line2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="City"
                      required
                      autoComplete="address-level2"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      placeholder="State"
                      required
                      autoComplete="address-level1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="zip">ZIP code</Label>
                    <Input
                      id="zip"
                      name="zip"
                      type="text"
                      placeholder="00000"
                      required
                      autoComplete="postal-code"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      placeholder="US"
                      required
                      autoComplete="country"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/30">
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Payment instructions will be included on your order confirmation
                  page. Your order will be placed as <strong>payment pending</strong>{" "}
                  and our team will reach out with next steps.
                </p>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Order Notes{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    (optional)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notes for your order</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any special instructions or questions..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column — order summary + CTA */}
          <div className="flex flex-col gap-4">
            <OrderSummary cart={cart} />

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Placing order..." : "Place Order"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

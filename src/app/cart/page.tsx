"use client";

import Link from "next/link";
import { useCart } from "@/providers/cart-provider";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { cart, loading } = useCart();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-heading mb-8 text-2xl font-semibold">Your Cart</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-heading mb-8 text-2xl font-semibold">Your Cart</h1>
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground opacity-40"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <div className="flex flex-col gap-2">
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">
              Add some products to get started.
            </p>
          </div>
          <Button>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-heading mb-8 text-2xl font-semibold">Your Cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items — spans 2 cols on lg */}
        <div className="lg:col-span-2">
          <div>
            {cart.items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>
          <div className="mt-4">
            <Link
              href="/products"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <OrderSummary cart={cart} />
          <Button className="w-full">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

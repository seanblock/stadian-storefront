import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>
          By using this store you agree to the terms and conditions set out
          below. Please read them carefully before placing an order.
        </p>
        <p>
          All products are sold for research purposes only. It is the
          responsibility of the purchaser to ensure compliance with all
          applicable laws and regulations in their jurisdiction.
        </p>
        <p>
          This page is a template — replace it with your full terms of service
          before accepting orders.
        </p>
      </div>
    </div>
  );
}

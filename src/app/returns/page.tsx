import type { Metadata } from "next";

export const metadata: Metadata = { title: "Return Policy" };

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Return Policy</h1>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
        <p>
          We want you to be satisfied with every purchase. If you are not
          completely happy with your order, please contact us within 30 days of
          receipt to discuss your options.
        </p>
        <p>
          Returns are accepted for unopened, undamaged products in their
          original packaging. Shipping costs for returns are the responsibility
          of the customer unless the return is due to our error.
        </p>
        <p>
          This page is a template — replace it with your full return policy
          before accepting orders.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  {
    question: "How do I place an order?",
    answer:
      "Browse our products, add items to your cart, and proceed to checkout. Follow the payment instructions provided on the order confirmation page.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Payment methods vary by store. Check the checkout page for available payment options.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Shipping times vary depending on your location and the products ordered. You'll receive tracking information once your order ships.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Please review our return policy for details on refunds and returns.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Once your order ships, you'll receive a tracking number via email. You can also check your order status in your account.",
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
      <div className="mt-8 divide-y">
        {faqs.map((faq, i) => (
          <details key={i} className="group py-4">
            <summary className="cursor-pointer font-medium hover:text-primary">
              {faq.question}
            </summary>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

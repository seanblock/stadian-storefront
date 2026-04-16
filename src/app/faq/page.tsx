import type { Metadata } from "next";
import { getFaq } from "@/app/actions/content";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const metadata: Metadata = { title: "FAQ" };

export default async function FAQPage() {
  const faqs = await getFaq();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
      {faqs.length > 0 ? (
        <Accordion className="mt-8">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="mt-6 text-muted-foreground">Coming soon.</p>
      )}
    </div>
  );
}

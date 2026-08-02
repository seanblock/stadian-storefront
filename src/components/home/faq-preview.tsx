import Link from "next/link";
import { getFaq } from "@/app/actions/content";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export async function FaqPreview() {
  let faqs: { question: string; answer: string }[] = [];
  try {
    faqs = await getFaq();
  } catch {
    // Section hides gracefully when the API is unavailable.
  }
  if (faqs.length === 0) return null;

  const top = faqs.slice(0, 5);

  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-16 gap-y-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:px-8">
        <header className="lg:col-span-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Questions
          </p>
          <h2 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
            Asked <span className="italic">often</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Straight answers about ordering, shipping, and storage.
          </p>
          <Link
            href="/faq"
            className="group mt-6 inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-foreground"
          >
            <span className="relative">
              All questions
              <span className="absolute inset-x-0 -bottom-1 block h-px origin-left scale-x-100 bg-current transition-transform duration-500 group-hover:scale-x-[0.4]" />
            </span>
            <svg
              className="size-4 transition-transform duration-500 group-hover:translate-x-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </header>

        <div className="lg:col-span-8">
          <Accordion>
            {top.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-[15px] font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

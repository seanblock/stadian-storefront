import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBranding } from "@/lib/branding";
import { getContactDetails } from "@/lib/contact-details";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const branding = await getBranding();
  const contact = getContactDetails(branding);
  if (!contact) notFound();

  const storeName = branding.store_name || "this store";
  const linkClass = "underline underline-offset-4 hover:text-foreground";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="mt-4 text-muted-foreground">
        {contact.legalName
          ? `${storeName} is operated by ${contact.legalName}.`
          : `How to reach ${storeName}.`}
      </p>

      <dl className="mt-10 space-y-6">
        {contact.email && (
          <div>
            <dt className="text-sm font-semibold">Email</dt>
            <dd className="mt-1 text-muted-foreground">
              <a href={`mailto:${contact.email}`} className={linkClass}>
                {contact.email}
              </a>
            </dd>
          </div>
        )}
        {contact.phone && (
          <div>
            <dt className="text-sm font-semibold">Phone</dt>
            <dd className="mt-1 text-muted-foreground">
              {contact.phoneHref ? (
                <a href={contact.phoneHref} className={linkClass}>
                  {contact.phone}
                </a>
              ) : (
                contact.phone
              )}
            </dd>
          </div>
        )}
        {contact.addressLines && (
          <div>
            <dt className="text-sm font-semibold">Address</dt>
            <dd className="mt-1 text-muted-foreground">
              <address className="not-italic">
                {contact.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

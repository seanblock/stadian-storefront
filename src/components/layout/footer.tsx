import Link from "next/link";
import type { StorefrontBranding } from "@stadian/storefront-sdk";

interface FooterProps {
  branding: StorefrontBranding;
}

const SOCIAL_ICONS: Record<string, string> = {
  twitter: "X",
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
};

const LINK_COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { href: "/products", label: "Catalog" },
      { href: "/cart", label: "Cart" },
      { href: "/account", label: "My Account" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/about", label: "About Us" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

const researchDisclaimer = (storeName: string) =>
  `All products sold by ${storeName} are intended for laboratory research use only. They are not for human consumption, and are not intended for medical, veterinary, diagnostic, or household use. Nothing on this site is medical advice. By purchasing, you confirm you are a qualified researcher or purchasing on behalf of a research organization.`;

export function Footer({ branding }: FooterProps) {
  const socialLinks = branding.social_links;
  const footerText = branding.footer_text;
  const storeName = branding.store_name || "Store";
  const tagline = branding.tagline;
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-auto"
      style={{ background: "#0a1a2e", color: "#f3ead5" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Top: brand + link columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-12">
          <div className="col-span-2 md:col-span-5 lg:col-span-6">
            <p className="text-base font-bold tracking-tight">
              {storeName}
            </p>
            {tagline && (
              <p
                className="mt-2 max-w-sm font-serif text-sm italic leading-relaxed"
                style={{ color: "#d4a951" }}
              >
                {tagline}
              </p>
            )}
            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <nav aria-label="Social links" className="mt-5 flex items-center gap-4">
                {Object.entries(socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm transition-opacity hover:opacity-100"
                    style={{ color: "#f3ead5b3" }}
                  >
                    {SOCIAL_ICONS[platform.toLowerCase()] || platform}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {LINK_COLUMNS.map((col) => (
            <nav
              key={col.heading}
              aria-label={`${col.heading} links`}
              className="md:col-span-2"
            >
              <p
                className="text-[11px] font-medium uppercase tracking-[0.18em]"
                style={{ color: "#d4a951" }}
              >
                {col.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm transition-colors hover:text-[#f3ead5]"
                      style={{ color: "#f3ead5b3" }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Research-use disclaimer */}
        <div className="mt-12 border-t pt-6" style={{ borderColor: "#f3ead51a" }}>
          <p
            className="max-w-4xl text-xs leading-relaxed"
            style={{ color: "#f3ead580" }}
          >
            {researchDisclaimer(storeName)}
          </p>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-6 flex flex-col gap-2 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "#f3ead51a" }}
        >
          <p className="text-sm" style={{ color: "#f3ead5b3" }}>
            {footerText
              ? footerText
              : `© ${year} ${storeName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import Image from "next/image";
import type { StorefrontBranding } from "@stadian/storefront-sdk";

interface FooterProps {
  branding: StorefrontBranding;
}

// Fixed brand palette — the footer is the navy "close" of the cream page.
const NAVY = "#0a1a2e";
const CREAM = "#f3ead5";
const GOLD = "#d4a951";

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
  const logoUrl = branding.logo_url || "/logo.png";
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative mt-auto overflow-hidden"
      style={{ background: NAVY, color: CREAM }}
    >
      {/* Gold hairline top edge — the seam where cream meets navy */}
      <div
        aria-hidden
        className="h-px w-full"
        style={{
          background: `linear-gradient(to right, transparent, ${GOLD}66, transparent)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        {/* Top: brand block + link columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-5 lg:col-span-6">
            <Link href="/" className="group inline-flex items-center gap-3">
              <Image
                src={logoUrl}
                alt={storeName}
                width={48}
                height={48}
                className="size-11 object-contain transition-transform duration-700 group-hover:rotate-[4deg]"
              />
              <span className="text-lg font-bold tracking-tight">
                {storeName}
              </span>
            </Link>

            <p
              className="mt-6 max-w-xs font-serif text-lg italic leading-snug"
              style={{ color: `${CREAM}d9` }}
            >
              {tagline || "Research-grade peptides · Est. 2026"}
            </p>

            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <nav
                aria-label="Social links"
                className="mt-7 flex items-center gap-3"
              >
                {Object.entries(socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center rounded-full border px-4 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-300"
                    style={{ borderColor: `${CREAM}26`, color: `${CREAM}cc` }}
                  >
                    {SOCIAL_ICONS[platform.toLowerCase()] || platform}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {/* Link columns */}
          {LINK_COLUMNS.map((col) => (
            <nav
              key={col.heading}
              aria-label={`${col.heading} links`}
              className="md:col-span-2"
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: GOLD }}
              >
                {col.heading}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group inline-flex items-center text-sm transition-colors duration-300 hover:text-[#f3ead5]"
                      style={{ color: `${CREAM}b3` }}
                    >
                      <span
                        aria-hidden
                        className="mr-0 inline-block h-px w-0 transition-all duration-300 group-hover:mr-2 group-hover:w-4"
                        style={{ background: GOLD }}
                      />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Research-use disclaimer */}
        <div
          className="mt-14 border-t pt-7"
          style={{ borderColor: `${CREAM}14` }}
        >
          <p
            className="max-w-4xl text-xs leading-relaxed"
            style={{ color: `${CREAM}80` }}
          >
            {researchDisclaimer(storeName)}
          </p>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-7 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: `${CREAM}14` }}
        >
          <p className="text-xs" style={{ color: `${CREAM}99` }}>
            {footerText
              ? footerText
              : `© ${year} ${storeName}. All rights reserved.`}
          </p>
          <p
            className="text-[11px] uppercase tracking-[0.16em]"
            style={{ color: `${CREAM}66` }}
          >
            For laboratory research use only
          </p>
        </div>
      </div>

      {/* Oversized brand wordmark watermark — anchored to the baseline,
          clipped by overflow-hidden for an editorial "masthead" close. */}
      <div
        aria-hidden
        className="pointer-events-none relative z-0 mt-8 select-none text-center leading-[0.8]"
      >
        <span
          className="font-serif italic"
          style={{
            fontSize: "clamp(4rem, 15vw, 13rem)",
            color: `${CREAM}0a`,
            letterSpacing: "-0.02em",
          }}
        >
          {storeName}
        </span>
      </div>
    </footer>
  );
}

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

export function Footer({ branding }: FooterProps) {
  const socialLinks = branding.social_links;
  const footerText = branding.footer_text;
  const storeName = branding.store_name || "Store";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav
          aria-label="Footer links"
          className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2"
        >
          {[
            { href: "/about", label: "About" },
            { href: "/faq", label: "FAQ" },
            { href: "/terms", label: "Terms" },
            { href: "/privacy", label: "Privacy" },
            { href: "/returns", label: "Returns" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {footerText
            ? footerText
            : `\u00A9 ${year} ${storeName}. All rights reserved.`}
        </p>

        {socialLinks && Object.keys(socialLinks).length > 0 && (
          <nav aria-label="Social links" className="flex items-center gap-4">
            {Object.entries(socialLinks).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {SOCIAL_ICONS[platform.toLowerCase()] || platform}
              </a>
            ))}
          </nav>
        )}
      </div>
      </div>
    </footer>
  );
}

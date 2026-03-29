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
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
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
    </footer>
  );
}

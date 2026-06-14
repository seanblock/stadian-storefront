import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { getBranding, brandingToCssVars } from "@/lib/branding";
import { getSiteUrl } from "@/lib/site-url";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/providers/auth-provider";
import { CartProvider } from "@/providers/cart-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  const siteUrl = getSiteUrl();
  const name = branding.store_name || "Store";
  const description = branding.tagline || "Welcome to our store";
  const ogImages = branding.logo_url ? [{ url: branding.logo_url }] : undefined;

  return {
    metadataBase: new URL(siteUrl),
    // Child pages set their own title; they render as "Page | Store".
    title: { default: name, template: `%s | ${name}` },
    description,
    applicationName: name,
    openGraph: {
      type: "website",
      siteName: name,
      title: name,
      description,
      url: siteUrl,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: branding.logo_url ? [branding.logo_url] : undefined,
    },
    icons: { icon: branding.logo_url || "/logo.png" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getBranding();
  const cssVars = brandingToCssVars(branding);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
      style={cssVars as React.CSSProperties}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Header branding={branding} />
              <main className="flex-1">{children}</main>
              <Footer branding={branding} />
              <CartDrawer />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

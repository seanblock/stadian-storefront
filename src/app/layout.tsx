import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getBranding, brandingToCssVars } from "@/lib/branding";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/providers/auth-provider";
import { CartProvider } from "@/providers/cart-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  return {
    title: branding.store_name || "Store",
    description: branding.tagline || "Welcome to our store",
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
      className={`${inter.variable} h-full antialiased`}
      style={cssVars as React.CSSProperties}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <CartProvider>
            <Header branding={branding} />
            <main className="flex-1">{children}</main>
            <Footer branding={branding} />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

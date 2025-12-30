import type { Metadata } from "next";
import { Quattrocento_Sans, Trirong } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const quattrocentoSans = Quattrocento_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const trirong = Trirong({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Herbarium Dyeworks | Naturally Dyed Yarn",
    template: "%s | Herbarium Dyeworks",
  },
  description:
    "Small batch, naturally dyed yarn from Northern Ireland. Sustainable, slow-dyed wool, alpaca silk, and BFL in beautiful botanical colors.",
  keywords: [
    "natural dye",
    "naturally dyed yarn",
    "hand dyed yarn",
    "sustainable yarn",
    "wool",
    "alpaca silk",
    "BFL",
    "Northern Ireland",
    "botanical dyes",
  ],
  authors: [{ name: "Herbarium Dyeworks" }],
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Herbarium Dyeworks",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${quattrocentoSans.variable} ${trirong.variable} font-body antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <CookieConsent />
      </body>
    </html>
  );
}

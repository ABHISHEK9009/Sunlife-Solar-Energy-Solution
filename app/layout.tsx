import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloating } from "@/components/layout/WhatsAppFloating";
import { StickyMobileBar } from "@/components/layout/StickyMobileBar";
import { LocalBusinessJsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/site-config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Sunlife Solar Energy Solution | Solar Company in Narmadapuram",
    template: "%s | Sunlife Solar Energy Solution",
  },
  description:
    "Sunlife Solar Energy Solution provides solar installation and rooftop solar solutions for homes, businesses and industries in Narmadapuram, Madhya Pradesh. Get a solar consultation today.",
  keywords: [
    "solar company in Narmadapuram",
    "solar panel installation in Narmadapuram",
    "solar installation Narmadapuram",
    "rooftop solar Narmadapuram",
    "solar energy company Narmadapuram",
    "solar company Madhya Pradesh",
    "residential solar installation",
    "commercial solar installation",
    "industrial solar installation",
    "rooftop solar installation",
    "solar EPC company",
    "solar energy solutions",
    "PM Surya Ghar Narmadapuram",
    "solar subsidy Madhya Pradesh",
  ],
  authors: [{ name: "Rahul Kumar Bamne", url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  icons: {
    icon: "/logo/icon.svg",
    shortcut: "/favicon.ico",
    apple: "/logo/icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "Sunlife Solar Energy Solution | Solar Company in Narmadapuram",
    description:
      "Professional rooftop solar installation solutions for homes, businesses and industries in Narmadapuram and across Madhya Pradesh.",
    images: [
      {
        url: "/images/hero-solar.jpg",
        width: 1200,
        height: 630,
        alt: "Sunlife Solar Energy Solution - Rooftop Solar in Narmadapuram MP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunlife Solar Energy Solution | Solar Company in Narmadapuram",
    description:
      "Professional rooftop solar installation solutions for homes, businesses and industries in Narmadapuram and across Madhya Pradesh.",
    images: ["/images/hero-solar.jpg"],
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B4D3C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <LocalBusinessJsonLd />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-white text-slate-900 pb-14 sm:pb-0">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <WhatsAppFloating />
        <StickyMobileBar />
      </body>
    </html>
  );
}

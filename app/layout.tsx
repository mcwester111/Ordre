import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Inter } from "next/font/google";
import "./globals.css";
import RefreshRedirect from "@/components/RefreshRedirect";
import CookieConsent from "@/components/CookieConsent";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-jost",
  display: "swap",
});

// Chat body — neutral grotesque, structured but full-bodied at 400/500.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "Ordre.";
const DESCRIPTION =
  "Your aesthetic, articulated. The AI fashion curator that understands your vision.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s",
  },
  description: DESCRIPTION,
  applicationName: "Ordre",
  keywords: [
    "Ordre",
    "AI fashion curator",
    "AI stylist",
    "personal styling",
    "aesthetic",
    "wardrobe",
  ],
  openGraph: {
    type: "website",
    siteName: "Ordre",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    // og image is supplied automatically by app/opengraph-image.jpg
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    // twitter image is supplied automatically by app/twitter-image.jpg
  },
};

export const viewport: Viewport = {
  // Matches the parchment background so mobile browser chrome blends in.
  themeColor: "#F5F0E8",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} ${inter.variable}`} style={{ colorScheme: "light" }}>
      <body className="font-sans antialiased">
        <RefreshRedirect />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}

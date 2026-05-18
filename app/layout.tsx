import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Bodoni_Moda } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ordre.",
  description: "Your aesthetic, articulated. The AI fashion curator that understands your vision.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} ${bodoni.variable}`} style={{ colorScheme: "light" }}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Playfair_Display, Space_Mono } from "next/font/google";
import "./globals.css";
import BetaBanner from "@/components/BetaBanner";
import MobileDesktopSuggestion from "@/components/MobileDesktopSuggestion";
import { Analytics } from "@vercel/analytics/react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700", "900"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "LexOculus | AI Compliance",
  description: "The optical engine for code compliance. Automated EU AI Act audit.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${spaceMono.variable} antialiased selection:bg-[#FF4F00] selection:text-white`}>
        <BetaBanner />
        <MobileDesktopSuggestion />
        {children}
        <Analytics />
      </body>
    </html>
  );
}

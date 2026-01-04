import type { Metadata } from "next";
import { Orbitron, Exo_2, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron"
});

const exo2 = Exo_2({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-exo2"
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '700'],
  subsets: ["latin"],
  variable: "--font-jetbrains"
});

export const metadata: Metadata = {
  title: "ComplianceAI - Premium Regulatory Intelligence",
  description: "Automated model governance for the modern enterprise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${exo2.variable} ${exo2.className} ${jetbrainsMono.variable} antialiased bg-[#030303] text-white selection:bg-white selection:text-black`}>
        {children}
      </body>
    </html>
  );
}

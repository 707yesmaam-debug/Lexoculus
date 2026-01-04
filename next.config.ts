import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Make PDFKit work properly in API routes (loads font files correctly)
  serverExternalPackages: ['pdfkit'],

  // Empty turbopack config to silence Next.js 16 warning
  turbopack: {},
};

export default nextConfig;

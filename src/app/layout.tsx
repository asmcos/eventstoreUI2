import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FumadocsShell from "@/components/providers/FumadocsShell";
import { buildMetadata, buildOrganizationJsonLd, buildWebsiteJsonLd } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = buildMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = buildWebsiteJsonLd();
  const orgJsonLd = buildOrganizationJsonLd();

  return (
    <html lang="zh-CN" className={`${inter.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/css/all.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 antialiased">
        <FumadocsShell>{children}</FumadocsShell>
      </body>
    </html>
  );
}

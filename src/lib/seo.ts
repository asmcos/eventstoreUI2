import type { Metadata } from "next";
import { siteConfig } from "./config";

interface PageSeoOptions {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "book";
  keywords?: string[];
  noIndex?: boolean;
}

export function buildMetadata(options: PageSeoOptions = {}): Metadata {
  const title = options.title
    ? `${options.title} | ${siteConfig.name}`
    : `${siteConfig.title} - 系统编程与操作系统技术资源`;

  const description = options.description ?? siteConfig.description;
  const url = options.path
    ? `${siteConfig.domain}${options.path}`
    : siteConfig.domain;

  const keywords = options.keywords ?? [...siteConfig.keywords];

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(siteConfig.domain),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "zh_CN",
      type: options.type === "article" ? "article" : "website",
      images: options.image
        ? [{ url: options.image, alt: title }]
        : [{ url: `${siteConfig.domain}/og-default.png`, alt: siteConfig.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: options.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.domain,
    description: siteConfig.description,
    inLanguage: "zh-CN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.domain}/books?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.domain,
    email: siteConfig.contact,
  };
}

export function buildItemListJsonLd(
  items: { name: string; url: string }[],
  listName: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function absoluteUrl(path: string) {
  return `${siteConfig.domain}${path.startsWith("/") ? path : `/${path}`}`;
}

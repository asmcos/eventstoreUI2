import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/creator", "/editbook", "/editblog", "/edittopic", "/login"],
    },
    sitemap: `${siteConfig.domain}/sitemap.xml`,
  };
}

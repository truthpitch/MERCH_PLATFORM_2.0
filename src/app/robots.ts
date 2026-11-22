// /robots.txt: lets search engines crawl the shop and blog, but not private pages.
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/cart", "/favorites", "/search", "/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

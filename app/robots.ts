import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow:     "/",
      // Per-shopper pages and the API. They also carry `noindex`; this keeps
      // crawlers from spending their budget fetching them at all.
      disallow:  ["/api/", "/account", "/cart", "/checkout", "/wishlist"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

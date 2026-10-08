import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/catalog";
import { productImages } from "@/lib/product";
import { absoluteUrl } from "@/lib/site";

/** Rebuilt hourly, so new products are listed without a deploy. */
export const revalidate = 3600;

const PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/",             priority: 1.0, changeFrequency: "daily"   },
  { path: "/shop-all",     priority: 0.9, changeFrequency: "daily"   },
  { path: "/about",        priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact",      priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms-of-use", priority: 0.2, changeFrequency: "yearly"  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A dashboard outage still yields the fixed pages rather than a broken file.
  const products = await getAllProducts().catch(() => []);

  return [
    ...PAGES.map(({ path, priority, changeFrequency }) => ({
      url: absoluteUrl(path),
      changeFrequency,
      priority,
    })),
    ...products
      .filter((p) => p.slug)
      .map((p) => ({
        url:             absoluteUrl(`/products/${p.slug}`),
        changeFrequency: "weekly" as const,
        priority:        0.8,
        images:          productImages(p),
      })),
  ];
}

import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import { getCollections, getProducts } from "@/lib/catalog";
import { STRIP_SIZE } from "@/components/ui/collection-strip";
import { Home } from "./home";

/** How many products the Featured row shows. */
const FEATURED_COUNT = 3;

/** Cached and refreshed every five minutes, like the product pages. */
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Who the shop is and how to search it, for the knowledge panel and sitelinks. */
const JSON_LD = [
  {
    "@context":   "https://schema.org",
    "@type":      "OnlineStore",
    name:         SITE_NAME,
    url:          SITE_URL,
    logo:         absoluteUrl("/icon.svg"),
    description:  SITE_DESCRIPTION,
    email:        "hello@glazekorea.com",
    telephone:    "+96181062168",
  },
  {
    "@context":   "https://schema.org",
    "@type":      "WebSite",
    name:         SITE_NAME,
    url:          SITE_URL,
    potentialAction: {
      "@type":       "SearchAction",
      target:        `${absoluteUrl("/shop-all")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
];

export default async function Page() {
  // Every read degrades to empty, so a dashboard outage hides the product
  // rows rather than the home page.
  const [featured, offers, bundles, collections] = await Promise.all([
    getProducts({ limit: FEATURED_COUNT }),
    getProducts({ collection: ["offers"],  limit: STRIP_SIZE }),
    getProducts({ collection: ["bundles"], limit: STRIP_SIZE }),
    getCollections(),
  ]);
  const titleOf = (slug: string) => collections.find((c) => c.slug === slug)?.title;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />
      <Home
        featured={featured}
        offers={{  title: titleOf("offers"),  products: offers  }}
        bundles={{ title: titleOf("bundles"), products: bundles }}
      />
    </>
  );
}

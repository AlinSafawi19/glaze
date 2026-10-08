import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import { Home } from "./home";

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

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />
      <Home />
    </>
  );
}

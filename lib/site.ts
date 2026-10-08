/**
 * Where the storefront lives, for everything that has to spell out a full URL:
 * canonical links, Open Graph tags, the sitemap and structured data.
 *
 * Set `NEXT_PUBLIC_SITE_URL` per deployment so a preview never claims to be
 * the canonical shop.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://glazekorea.com").replace(/\/+$/, "");

export const SITE_NAME = "GLAZE";

export const SITE_DESCRIPTION =
  "Authentic Korean skincare, curated and delivered across Lebanon. Cleansers, toners, serums and sunscreens from the brands Seoul trusts — cash on delivery.";

/** Prices on the storefront are shown in dollars. */
export const CURRENCY = "USD";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

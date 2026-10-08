import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getRelated } from "@/lib/catalog";
import { productImages, salePrice, slugLabel, type Product } from "@/lib/product";
import { isSoldOut } from "@/lib/stock";
import { CURRENCY, SITE_NAME, absoluteUrl } from "@/lib/site";
import { ProductView } from "./product-view";

/** How many other products the page shows under "you may also like". */
const RELATED_COUNT = 4;

/**
 * Rendered on first request and kept for five minutes, so a crawl of the
 * catalogue is served from cache rather than hitting the dashboard per page,
 * while price and stock changes still show up within minutes.
 */
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

/** Search snippets cut off around 155 characters; end on a word, not mid-way. */
function snippet(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max - 1))}…`;
}

function describe(product: Product): string {
  const lead = product.brand ? `${slugLabel(product.brand)} ${product.title}` : product.title;
  return snippet(product.description ? `${lead}. ${product.description}` : `${lead} — authentic Korean skincare from ${SITE_NAME}.`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const path        = `/products/${product.slug}`;
  const description = describe(product);
  const images      = productImages(product).map((url) => ({ url, alt: product.title }));

  return {
    title:       product.title,
    description,
    alternates:  { canonical: path },
    openGraph:   { type: "website", url: path, title: product.title, description, images },
    twitter:     { card: "summary_large_image", title: product.title, description, images: images.map((i) => i.url) },
  };
}

/** schema.org Product, so search results can show price and availability. */
function productJsonLd(product: Product) {
  const url = absoluteUrl(`/products/${product.slug}`);

  return {
    "@context":   "https://schema.org",
    "@type":      "Product",
    name:         product.title,
    url,
    image:        productImages(product),
    description:  product.description || undefined,
    sku:          product.slug,
    category:     product.categories.map(slugLabel).join(", ") || undefined,
    brand:        product.brand ? { "@type": "Brand", name: slugLabel(product.brand) } : undefined,
    offers: {
      "@type":        "Offer",
      url,
      price:          salePrice(product).toFixed(2),
      priceCurrency:  CURRENCY,
      availability:   isSoldOut(product.stock) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition:  "https://schema.org/NewCondition",
      seller:         { "@type": "Organization", name: SITE_NAME },
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  // Resolved before anything renders so a missing product gets a real 404
  // status, not a 200 with "not found" written on it.
  const [product, related] = await Promise.all([getProduct(slug), getRelated(slug, RELATED_COUNT)]);
  if (!product) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c") }}
      />
      {/* Keyed so per-product state (gallery position, "Added to cart")
          starts fresh when one product page links to another. */}
      <ProductView key={product.slug} product={product} related={related} />
    </>
  );
}

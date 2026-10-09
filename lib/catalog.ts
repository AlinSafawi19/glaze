import { cache } from "react";
import { fetchPage, MAX_PAGE_SIZE, type Query } from "@/lib/api";
import { toProduct, type Product, type RawProduct } from "@/lib/product";

/**
 * Catalogue reads for server components.
 *
 * Unlike `fetchRows`, these let a failed request throw. On the server that
 * difference matters: a swallowed error reads as "no such product", which
 * would answer a dashboard outage with a 404 and tell search engines to drop
 * the page. Thrown, it is a 500, and crawlers come back later.
 */

/**
 * One product by slug, or null when there is none. Wrapped in `cache` so
 * `generateMetadata` and the page share a single request.
 */
export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  const { rows } = await fetchPage<RawProduct>("products", { slug: [slug], limit: 1 });
  return rows[0] ? toProduct(rows[0]) : null;
});

/** A handful of other products for the strip under a product. */
export async function getRelated(slug: string, limit: number): Promise<Product[]> {
  const { rows } = await fetchPage<RawProduct>("products", { exclude: [slug], limit });
  return rows.map(toProduct);
}

/** Every product, for the sitemap. Walks the catalogue a page at a time. */
export async function getAllProducts(): Promise<Product[]> {
  const products: Product[] = [];

  for (let page = 1; ; page++) {
    const { rows, pagination } = await fetchPage<RawProduct>("products", { page, limit: MAX_PAGE_SIZE });
    products.push(...rows.map(toProduct));
    if (!pagination.hasMore || rows.length === 0) break;
  }

  return products;
}

/**
 * A page of products for a merchandising strip. Unlike a product page, a strip
 * that cannot load drops out rather than taking the whole page down with it.
 */
export async function getProducts(query: Query): Promise<Product[]> {
  try {
    const { rows } = await fetchPage<RawProduct>("products", query);
    return rows.map(toProduct);
  } catch {
    return [];
  }
}

export interface Collection {
  slug:  string;
  title: string;
}

/** The dashboard's collection names, keyed by slug. Empty if the list cannot load. */
export const getCollections = cache(async (): Promise<Collection[]> => {
  try {
    const { rows } = await fetchPage<{ Slug: string; Title: string }>("collections", { limit: MAX_PAGE_SIZE });
    return rows.map((r) => ({ slug: r.Slug, title: r.Title }));
  } catch {
    return [];
  }
});

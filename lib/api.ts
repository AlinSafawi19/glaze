/**
 * The storefront's half of the dashboard's public API.
 *
 * Every collection endpoint takes the same query language: `page` and `limit`
 * for the window, `slug` to fetch named rows, `search`, `startsWith`, `exclude`
 * and `sort`, plus the relation filters `category`, `brand`, `collection` and
 * `skinType` on products. Filtering happens in the database, so a request
 * returns the rows being shown and nothing else — the browser never holds the
 * catalogue, and a shop can grow without the shop page growing with it.
 *
 * Responses are `{ data, pagination: { total, page, limit, totalPages,
 * hasMore }, facets? }`. A `limit` above 100 is refused rather than clamped, so
 * requests are held to that ceiling here before they are sent.
 */

const BASE = process.env.NEXT_PUBLIC_DASHBOARD_BACKEND_URL;

const API_HEADERS = {
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_DASHBOARD_API_KEY}`,
};

/** Server-side ceiling on `limit`. Asking for more is a 400, not a short page. */
export const MAX_PAGE_SIZE = 100;

export function endpoint(collection: string): string {
  return `${BASE}/glaze/${collection}`;
}

/** Titles that do not begin with a letter, as `startsWith` spells it. */
export const NON_ALPHA = "#";

export type Sort = "added" | "name" | "price" | "-price" | "newest" | "oldest";

export interface Query {
  page?:  number;
  limit?: number;
  /** Exact slugs — resolves a saved cart or one product page in one request. */
  slug?:  string[];
  /** Slugs to leave out, for a related-products strip. */
  exclude?: string[];
  search?: string;
  /** A single letter, or {@link NON_ALPHA}. */
  startsWith?: string;
  category?:   string[];
  brand?:      string[];
  collection?: string[];
  skinType?:   string[];
  sort?:       Sort;
  /** Aggregates to return alongside the page. Currently only `initials`. */
  facets?: string[];
}

export interface Pagination {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  hasMore:    boolean;
}

export interface Facets {
  /** Distinct first letters across the whole collection, uppercase. */
  initials?: string[];
}

export interface Page<T> {
  rows:       T[];
  pagination: Pagination;
  facets:     Facets;
}

/** Empty lists are dropped rather than sent as `?brand=`, which reads as noise. */
function buildUrl(collection: string, query: Query): URL {
  const url = new URL(endpoint(collection));
  const set = (key: string, value: string) => url.searchParams.set(key, value);

  if (query.page)  set("page", String(query.page));
  if (query.limit) set("limit", String(Math.min(query.limit, MAX_PAGE_SIZE)));
  if (query.search?.trim())     set("search", query.search.trim());
  if (query.startsWith)         set("startsWith", query.startsWith);
  if (query.sort)               set("sort", query.sort);

  for (const key of ["slug", "exclude", "category", "brand", "collection", "skinType", "facets"] as const) {
    const values = query[key];
    if (values && values.length > 0) set(key, values.join(","));
  }

  return url;
}

/**
 * One page of a collection.
 *
 * Throws on a network failure or an error status — including a 400, which means
 * the query itself was wrong and is worth surfacing rather than swallowing.
 */
export async function fetchPage<T>(
  collection: string,
  query: Query = {},
  signal?: AbortSignal,
): Promise<Page<T>> {
  const res = await fetch(buildUrl(collection, query), { headers: API_HEADERS, signal });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `${res.status} ${res.statusText}`);
  }

  const body = await res.json();
  const rows: T[] = body?.data ?? [];
  const reported = body?.pagination;
  const page  = Number(reported?.page)  || query.page  || 1;
  const limit = Number(reported?.limit) || rows.length;
  const totalPages = Number(reported?.totalPages) || 1;

  return {
    rows,
    pagination: {
      total: Number(reported?.total) || rows.length,
      page,
      limit,
      totalPages,
      hasMore: reported?.hasMore ?? page < totalPages,
    },
    facets: body?.facets ?? {},
  };
}

/** One page's worth of rows, or an empty list if the request fails. */
export async function fetchRows<T>(
  collection: string,
  query: Query = {},
  signal?: AbortSignal,
): Promise<T[]> {
  try {
    return (await fetchPage<T>(collection, query, signal)).rows;
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    return [];
  }
}

/**
 * A single row by slug, or null.
 *
 * The endpoint has no by-id route; a one-slug filter is the equivalent and
 * costs one indexed lookup.
 */
export async function fetchBySlug<T>(
  collection: string,
  slug: string,
  signal?: AbortSignal,
): Promise<T | null> {
  const rows = await fetchRows<T>(collection, { slug: [slug], limit: 1 }, signal);
  return rows[0] ?? null;
}

/**
 * Rows for a set of slugs, in one request.
 *
 * The server accepts up to 50 values at a time, so a long saved cart is split
 * across a few requests rather than being cut short. Order follows `slugs`, not
 * the database — a shopper's list should stay in the order they built it.
 */
export async function fetchBySlugs<T extends { Slug?: string }>(
  collection: string,
  slugs: string[],
  signal?: AbortSignal,
): Promise<T[]> {
  const CHUNK = 50;
  if (slugs.length === 0) return [];

  const batches: Promise<T[]>[] = [];
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const batch = slugs.slice(i, i + CHUNK);
    batches.push(fetchRows<T>(collection, { slug: batch, limit: MAX_PAGE_SIZE }, signal));
  }

  const found = new Map<string, T>();
  for (const rows of await Promise.all(batches)) {
    for (const row of rows) if (row.Slug) found.set(row.Slug, row);
  }

  return slugs.map((slug) => found.get(slug)).filter((row): row is T => Boolean(row));
}

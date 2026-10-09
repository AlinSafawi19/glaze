import { ShopSection } from "@/components/ui/shop-section";
import type { ProductFilters, ShopSeed } from "@/components/ui/use-shop-data";
import { fetchPage, type Query } from "@/lib/api";
import { DESKTOP_PAGE_SIZE } from "@/lib/shop";

/** How long a first page is reused across visitors. */
const CACHE_FOR = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** `?brand=a,b` as the shop reads it: split, trimmed, de-duplicated. */
function list(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value[0] : value;
  return [...new Set((raw ?? "").split(",").map((s) => s.trim()).filter(Boolean))];
}

/**
 * The first page of whatever the URL selects, fetched here so the grid is in
 * the HTML a crawler receives — `?brand=` links included. The selection is read
 * exactly the way `ShopSection` reads it, so the grid can open on this page
 * rather than fetching it again. An outage leaves the grid to load in the
 * browser, as it did before.
 */
async function firstPage(params: Awaited<SearchParams>): Promise<ShopSeed | undefined> {
  const q = params.q;
  const filters: ProductFilters = {
    search:      (Array.isArray(q) ? q[0] : q) ?? "",
    categories:  list(params.category),
    brands:      list(params.brand),
    collections: list(params.collection),
    skinTypes:   [],
  };

  const query: Query = { page: 1, limit: DESKTOP_PAGE_SIZE };
  if (filters.search.trim())      query.search     = filters.search;
  if (filters.categories.length)  query.category   = filters.categories;
  if (filters.brands.length)      query.brand      = filters.brands;
  if (filters.collections.length) query.collection = filters.collections;

  try {
    const { rows, pagination } = await fetchPage<ShopSeed["rows"][number]>("products", query, undefined, CACHE_FOR);
    return { filters, rows, total: pagination.total, hasMore: pagination.hasMore, pageSize: DESKTOP_PAGE_SIZE };
  } catch {
    return undefined;
  }
}

export default async function ShopAll({ searchParams }: { searchParams: SearchParams }) {
  const seed = await firstPage(await searchParams);

  return (
    <main>
      {/* The shop is the page, with no hero in front of it, so its heading is
          for search engines and screen readers rather than on screen. */}
      <h1 className="sr-only">Shop all Korean skincare</h1>

      {/* Rendered per request, so `useSearchParams` inside resolves on the
          server and no Suspense boundary is needed to hold it back. */}
      <ShopSection seed={seed} />
    </main>
  );
}

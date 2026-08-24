/**
 * The storefront's half of the dashboard's public API.
 *
 * Every collection endpoint is paged: `?page=` is 1-based, `?limit=` defaults to
 * 20 and is **capped at 100 server-side** — asking for more silently returns
 * 100. Responses carry `{ data, pagination: { total, page, limit, totalPages } }`.
 *
 * The API has no filtering or search of its own, so the shop's category, brand,
 * collection and skin-type filters have to run over the whole catalogue on the
 * client. That makes walking the pages non-optional: a single request cannot
 * return more than 100 rows, and a request with no `limit` at all returns 20.
 */

const BASE = process.env.NEXT_PUBLIC_DASHBOARD_BACKEND_URL;

export const API_HEADERS = {
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_DASHBOARD_API_KEY}`,
};

/** Server-side ceiling on `limit`. Larger values are clamped, not rejected. */
export const MAX_PAGE_SIZE = 100;

/**
 * Stop walking after this many pages — 10,000 rows at the maximum page size.
 * A shop is not expected to reach it; it is here so a backend that reports a
 * wrong `totalPages` cannot spin the browser forever.
 */
const MAX_PAGES = 100;

export function endpoint(collection: string): string {
  return `${BASE}/glaze/${collection}`;
}

export interface Pagination {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface PageResult<T> {
  rows:       T[];
  pagination: Pagination;
}

/** One page of a collection. Throws on a network or HTTP failure. */
export async function fetchPage<T>(
  url: string,
  { page = 1, limit = MAX_PAGE_SIZE, signal }: { page?: number; limit?: number; signal?: AbortSignal } = {},
): Promise<PageResult<T>> {
  const target = new URL(url);
  target.searchParams.set("page", String(page));
  target.searchParams.set("limit", String(Math.min(limit, MAX_PAGE_SIZE)));

  const res = await fetch(target, { headers: API_HEADERS, signal });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const body = await res.json();
  const rows: T[] = body?.data ?? [];

  // An endpoint that reports no pagination is treated as a single page, so a
  // shape change upstream degrades to today's behaviour instead of looping.
  const reported = body?.pagination;
  return {
    rows,
    pagination: {
      total:      Number(reported?.total)      || rows.length,
      page:       Number(reported?.page)       || page,
      limit:      Number(reported?.limit)      || rows.length,
      totalPages: Number(reported?.totalPages) || 1,
    },
  };
}

export interface FetchAllOptions<T> {
  signal?: AbortSignal;
  /** Rows per request. Clamped to {@link MAX_PAGE_SIZE}. */
  limit?:  number;
  /**
   * Called as each page lands, with everything gathered so far. Lets a list
   * paint its first hundred rows while the rest are still arriving, rather than
   * holding the page blank until the last one.
   */
  onPage?: (rowsSoFar: T[], pagination: Pagination) => void;
  /**
   * Checked after each page: return true to stop walking. Lets a caller that
   * only needs to find one row — a product page resolving a slug — leave the
   * rest of a large catalogue on the server.
   */
  stopWhen?: (rowsSoFar: T[]) => boolean;
}

/**
 * Every row of a collection, gathered a page at a time.
 *
 * Pages are walked in sequence rather than fired off at once: the row count is
 * only known after the first response, and a shop with a large catalogue should
 * not open by throwing thirty parallel requests at its own backend.
 *
 * A failure part-way through keeps what already arrived — a shop showing its
 * first few hundred products beats a shop showing none.
 */
export async function fetchAll<T>(
  url: string,
  { signal, limit = MAX_PAGE_SIZE, onPage, stopWhen }: FetchAllOptions<T> = {},
): Promise<T[]> {
  const rows: T[] = [];

  try {
    let page  = 1;
    let pages = 1;

    do {
      const result = await fetchPage<T>(url, { page, limit, signal });
      rows.push(...result.rows);
      pages = Math.min(result.pagination.totalPages, MAX_PAGES);
      onPage?.(rows, result.pagination);

      // A page that comes back empty means the walk is done, whatever the
      // reported total said.
      if (result.rows.length === 0) break;
      if (stopWhen?.(rows)) break;
      page++;
    } while (page <= pages && !signal?.aborted);
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    // Swallowed on purpose — see the note above.
  }

  return rows;
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchPage, MAX_PAGE_SIZE, NON_ALPHA, type Query, type Sort } from "@/lib/api";
import { categorySlugs, relationSlug, skinTypeSlugs, type Relation, type RawRelations } from "@/lib/relations";
import { parseStock } from "@/lib/stock";
import type { FilterItem } from "./filters";

/**
 * Everything the shop reads, asked for one page at a time.
 *
 * The filters run in the database now, so each of these hooks holds exactly
 * what is on screen: a page of products for the current selection, a page of
 * options per filter group, a page of brands for the letter being browsed. A
 * shop with fifty products and one with fifty thousand cost the browser the
 * same.
 */

// ── shared ───────────────────────────────────────────────────────────────────

interface RawTaxonomy {
  id:    string;
  Title: string;
  Slug:  string;
}

function toFilterItem(row: RawTaxonomy): FilterItem {
  return { id: row.id, name: row.Title, slug: row.Slug };
}

/** Holds a value back until it stops changing — one request per pause, not per keystroke. */
export function useDebounced<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}

export interface PagedList<T> {
  items:   T[];
  /** Rows the server holds in total, not the number loaded so far. */
  total:   number;
  hasMore: boolean;
  /** There is nothing to show yet — the first page has never arrived. */
  loading: boolean;
  /**
   * A fresh first page is in flight while the last one's rows are still on
   * screen. What is showing is stale rather than absent, so it is worth keeping
   * up and marking busy instead of tearing it down for a spinner.
   */
  refreshing: boolean;
  /** A later page is in flight — what is on screen stays put. */
  loadingMore: boolean;
  loadMore: () => void;
}

// ── filter options ───────────────────────────────────────────────────────────

/**
 * One filter group's options.
 *
 * Ordering is left to the dashboard, which sorts these lists by hand — asking
 * for them alphabetically here would quietly override the shop's own
 * arrangement. `sort` is for the lists where that does not hold: a roster the
 * shopper scans by name, like brands, reads as broken in curation order.
 */
export function useFilterOptions(collection: string, pageSize: number, sort?: Sort): PagedList<FilterItem> {
  const [items,   setItems]   = useState<FilterItem[]>([]);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy,    setBusy]    = useState(true);

  // Marked busy in the render that changes the request, not in the effect that
  // sends it: the control has to read as pressed on the frame it was pressed,
  // and a state write inside an effect is a second render either way.
  const request = `${collection}|${page}|${pageSize}|${sort ?? ""}`;
  const [sent, setSent] = useState(request);
  if (sent !== request) {
    setSent(request);
    setBusy(true);
  }

  useEffect(() => {
    const abort = new AbortController();

    const query: Query = { page, limit: pageSize };
    if (sort) query.sort = sort;

    fetchPage<RawTaxonomy>(collection, query, abort.signal)
      .then(({ rows, pagination }) => {
        if (abort.signal.aborted) return;
        const mapped = rows.map(toFilterItem);
        // Replacing on page 1 rather than always appending keeps a remount or a
        // retry from showing every option twice.
        setItems((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
        setTotal(pagination.total);
        setHasMore(pagination.hasMore);
      })
      .catch(() => { /* a list that fails to load is a group with no filter, not a dead page */ })
      .finally(() => { if (!abort.signal.aborted) setBusy(false); });

    return () => abort.abort();
  }, [collection, page, pageSize, sort]);

  const loadMore = useCallback(() => {
    if (!busy && hasMore) setPage((p) => p + 1);
  }, [busy, hasMore]);

  return {
    items,
    total,
    hasMore,
    loading:     busy && items.length === 0,
    refreshing:  busy && page === 1 && items.length > 0,
    // Keyed on the page being asked for, not on whether anything is on screen —
    // a first page fetched over stale rows is a refresh, not an append.
    loadingMore: busy && page > 1,
    loadMore,
  };
}

// ── brands ───────────────────────────────────────────────────────────────────

/** The A–Z index's "no letter picked" state. */
export const ALL_LETTERS = "ALL";

/** The server takes this many slugs per request; a longer list is split. */
const SLUG_CHUNK = 50;

/** Shared, so an empty result keeps its identity and does not re-render on every pass. */
const NO_SLUGS: string[] = [];

/**
 * Brand rows seen anywhere this session, keyed by slug.
 *
 * The shop has to name brands it is not currently listing — one picked under K
 * while M is on screen, or one arriving in a link — and a name is fixed for as
 * long as the tab is open. Holding them here means a pinned chip costs a lookup
 * once rather than on every letter change.
 */
const brandNames = new Map<string, FilterItem>();

function rememberBrands(items: FilterItem[]) {
  for (const item of items) brandNames.set(item.slug, item);
}

export interface BrandIndexData extends PagedList<FilterItem> {
  /** Letter currently being browsed, or {@link ALL_LETTERS}. */
  letter: string;
  setLetter: (letter: string) => void;
  /** Which letters have brands behind them, across the whole list. */
  initials: Set<string>;
}

/**
 * Brands for the letter on screen.
 *
 * The letter is a server-side filter, so picking "K" costs one query for the K
 * brands rather than downloading every brand to find them. The set of live
 * initials comes back as a facet on the first request — the index has to keep
 * offering the other letters once one has been picked, so it cannot be derived
 * from the rows in hand.
 *
 * Sorted by name: an index headed A–Z that lists its brands in the dashboard's
 * hand-sorted order reads as though the letters do nothing.
 */
export function useBrandIndex(pageSize: number): BrandIndexData {
  const [letter,   setLetter]   = useState(ALL_LETTERS);
  const [items,    setItems]    = useState<FilterItem[]>([]);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [hasMore,  setHasMore]  = useState(false);
  const [busy,     setBusy]     = useState(true);
  const [initials, setInitials] = useState<Set<string>>(new Set());

  const haveInitials = useRef(false);

  // Adjusting during render rather than in an effect, so a new letter never
  // paints one frame of the previous letter's page number - and the strip reads
  // as busy on the frame the letter was clicked.
  const [seenLetter, setSeenLetter] = useState(letter);
  if (seenLetter !== letter) {
    setSeenLetter(letter);
    setPage(1);
    setBusy(true);
  }

  const request = `${letter}|${page}|${pageSize}`;
  const [sent, setSent] = useState(request);
  if (sent !== request) {
    setSent(request);
    setBusy(true);
  }

  useEffect(() => {
    const abort = new AbortController();

    const query: Query = { page, limit: pageSize, sort: "name" };
    if (letter !== ALL_LETTERS) query.startsWith = letter;
    if (!haveInitials.current) query.facets = ["initials"];

    fetchPage<RawTaxonomy>("brands", query, abort.signal)
      .then(({ rows, pagination, facets }) => {
        if (abort.signal.aborted) return;
        const mapped = rows.map(toFilterItem);
        rememberBrands(mapped);
        setItems((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
        setTotal(pagination.total);
        setHasMore(pagination.hasMore);
        if (facets.initials) {
          haveInitials.current = true;
          setInitials(new Set(facets.initials));
        }
      })
      .catch(() => { /* an empty index simply does not render */ })
      .finally(() => { if (!abort.signal.aborted) setBusy(false); });

    return () => abort.abort();
  }, [letter, page, pageSize]);

  const loadMore = useCallback(() => {
    if (!busy && hasMore) setPage((p) => p + 1);
  }, [busy, hasMore]);

  return {
    items,
    total,
    hasMore,
    loading:     busy && items.length === 0,
    // A letter change keeps the previous letter's chips up until the new ones
    // land, so the strip has to say it is busy - otherwise it sits there
    // showing the wrong letter's brands as though they were the answer.
    refreshing:  busy && page === 1 && items.length > 0,
    loadingMore: busy && page > 1,
    loadMore,
    letter,
    setLetter,
    initials,
  };
}

export interface BrandLookup {
  /** The named brands behind the given slugs, in the order asked for. */
  items:   FilterItem[];
  /** Slugs the server answered for and had no brand under. */
  unknown: string[];
  loading: boolean;
}

/**
 * Names for a set of brand slugs, whatever letter they live under.
 *
 * A selection is slugs, and a slug is not something to show a shopper — so the
 * shop resolves the ones it cannot already name. Only slugs missing from the
 * session's cache are asked for, which in practice means the ones that arrived
 * in a link rather than the ones just clicked.
 *
 * `unknown` is reported only for a request that actually came back: a lookup
 * that fails says nothing about whether a slug is real, and treating a network
 * blip as "no such brand" would quietly wipe the shopper's selection.
 */
export function useBrandsBySlug(slugs: string[]): BrandLookup {
  const key = slugs.join(",");

  /** Only slugs this session has never named cost a request. */
  const anyMissing = (list: string) =>
    (list ? list.split(",") : []).some((slug) => !brandNames.has(slug));

  const [unknown, setUnknown] = useState<string[]>(NO_SLUGS);
  const [busy,    setBusy]    = useState(() => anyMissing(key));
  // Bumped once a fetch has written names into the shared cache, so the list
  // below recomputes against a key that has not itself changed.
  const [resolved, setResolved] = useState(0);

  // Adjusted during render rather than in the effect, the same way the paged
  // hooks above do it: a new selection is a new question, and last question's
  // answer must not outlive it for a frame.
  const [sent, setSent] = useState(key);
  if (sent !== key) {
    setSent(key);
    setUnknown(NO_SLUGS);
    setBusy(anyMissing(key));
  }

  useEffect(() => {
    const wanted  = key ? key.split(",") : [];
    const missing = wanted.filter((slug) => !brandNames.has(slug));
    if (missing.length === 0) return;

    const abort = new AbortController();

    (async () => {
      const found: FilterItem[] = [];
      for (let i = 0; i < missing.length; i += SLUG_CHUNK) {
        const { rows } = await fetchPage<RawTaxonomy>(
          "brands",
          { slug: missing.slice(i, i + SLUG_CHUNK), limit: MAX_PAGE_SIZE },
          abort.signal,
        );
        found.push(...rows.map(toFilterItem));
      }
      if (abort.signal.aborted) return;

      rememberBrands(found);
      const named = new Set(found.map((item) => item.slug));
      const gone  = missing.filter((slug) => !named.has(slug));
      setUnknown(gone.length > 0 ? gone : NO_SLUGS);
      setResolved((n) => n + 1);
    })()
      .catch(() => { /* a name that will not load is not a slug that is wrong */ })
      .finally(() => { if (!abort.signal.aborted) setBusy(false); });

    return () => abort.abort();
  }, [key]);

  const items = useMemo(
    () => (key ? key.split(",") : [])
      .map((slug) => brandNames.get(slug))
      .filter((item): item is FilterItem => Boolean(item)),
    // `resolved` stands for the shared cache having gained the missing names.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, resolved],
  );

  return { items, unknown, loading: busy };
}

// ── products ─────────────────────────────────────────────────────────────────

export interface RawProduct extends RawRelations {
  id:            string;
  Slug:          string;
  Title:         string;
  "Cover img 1": string;
  Price:         string;
  Discount:      string;
  Brand:         Relation;
  Collections:   Relation;
  Stock?:        string;
}

export interface Product {
  id:          string;
  slug:        string;
  title:       string;
  price:       number;
  discount:    number;
  imageSrc:    string;
  stock:       number | null;
  /** A product can be filed under several headings at once. */
  categories:  string[];
  brand:       string;
  collections: string;
  skinTypes:   string[];
}

export function toProduct(e: RawProduct): Product {
  return {
    id:          e.id,
    slug:        e.Slug,
    title:       e.Title,
    price:       parseFloat(e.Price)    || 0,
    discount:    parseFloat(e.Discount) || 0,
    imageSrc:    e["Cover img 1"],
    stock:       parseStock(e.Stock),
    categories:  categorySlugs(e),
    brand:       relationSlug(e.Brand),
    collections: relationSlug(e.Collections),
    skinTypes:   skinTypeSlugs(e),
  };
}

export interface ProductFilters {
  search:      string;
  categories:  string[];
  brands:      string[];
  collections: string[];
  skinTypes:   string[];
}

export type ProductPage = PagedList<Product>;

/**
 * The shop grid.
 *
 * Every filter goes to the server, so "load more" asks for the next page of the
 * current selection — and changing a filter starts a fresh first page rather
 * than re-slicing rows that are already stale.
 */
export function useShopProducts(filters: ProductFilters, pageSize: number): ProductPage {
  const [items,   setItems]   = useState<Product[]>([]);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy,    setBusy]    = useState(true);

  // One string standing for the whole selection: it is what decides when the
  // grid has to start over, and comparing it is cheaper than five array diffs.
  const key = useMemo(
    () => JSON.stringify([
      filters.search,
      filters.categories,
      filters.brands,
      filters.collections,
      filters.skinTypes,
      pageSize,
    ]),
    [filters, pageSize],
  );

  const [seenKey, setSeenKey] = useState(key);
  if (seenKey !== key) {
    setSeenKey(key);
    setPage(1);
    setBusy(true);
  }

  const request = `${key}|${page}`;
  const [sent, setSent] = useState(request);
  if (sent !== request) {
    setSent(request);
    setBusy(true);
  }

  useEffect(() => {
    const abort = new AbortController();

    const query: Query = { page, limit: pageSize };
    if (filters.search.trim())      query.search     = filters.search;
    if (filters.categories.length)  query.category   = filters.categories;
    if (filters.brands.length)      query.brand      = filters.brands;
    if (filters.collections.length) query.collection = filters.collections;
    if (filters.skinTypes.length)   query.skinType   = filters.skinTypes;

    fetchPage<RawProduct>("products", query, abort.signal)
      .then(({ rows, pagination }) => {
        if (abort.signal.aborted) return;
        const mapped = rows.map(toProduct);
        setItems((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
        setTotal(pagination.total);
        setHasMore(pagination.hasMore);
      })
      .catch(() => {
        if (abort.signal.aborted) return;
        // A failed page leaves the grid as it was rather than emptying it under
        // the shopper — except on the first, where there is nothing to keep.
        if (page === 1) { setItems([]); setTotal(0); setHasMore(false); }
      })
      .finally(() => { if (!abort.signal.aborted) setBusy(false); });

    return () => abort.abort();
    // `key` stands in for the filter values it was built from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page]);

  const loadMore = useCallback(() => {
    if (!busy && hasMore) setPage((p) => p + 1);
  }, [busy, hasMore]);

  return {
    items,
    total,
    hasMore,
    // Only a grid with nothing in it is worth a loader. A filter change over a
    // grid the shopper is already reading dims what is there instead of
    // replacing it with half a screen of wordmark.
    loading:     busy && items.length === 0,
    refreshing:  busy && page === 1 && items.length > 0,
    loadingMore: busy && page > 1,
    loadMore,
  };
}

export { NON_ALPHA };

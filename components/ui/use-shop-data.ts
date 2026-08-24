"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchPage, NON_ALPHA, type Query } from "@/lib/api";
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
  /** The first page is still in flight — there is nothing to show yet. */
  loading: boolean;
  /** A later page is in flight — what is on screen stays put. */
  loadingMore: boolean;
  loadMore: () => void;
}

// ── filter options ───────────────────────────────────────────────────────────

/**
 * One filter group's options.
 *
 * Ordering is left to the dashboard, which sorts these lists by hand — asking
 * for them alphabetically here would quietly override the shop's own arrangement.
 */
export function useFilterOptions(collection: string, pageSize: number): PagedList<FilterItem> {
  const [items,   setItems]   = useState<FilterItem[]>([]);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy,    setBusy]    = useState(true);

  // Marked busy in the render that changes the request, not in the effect that
  // sends it: the control has to read as pressed on the frame it was pressed,
  // and a state write inside an effect is a second render either way.
  const request = `${collection}|${page}|${pageSize}`;
  const [sent, setSent] = useState(request);
  if (sent !== request) {
    setSent(request);
    setBusy(true);
  }

  useEffect(() => {
    const abort = new AbortController();

    fetchPage<RawTaxonomy>(collection, { page, limit: pageSize }, abort.signal)
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
  }, [collection, page, pageSize]);

  const loadMore = useCallback(() => {
    if (!busy && hasMore) setPage((p) => p + 1);
  }, [busy, hasMore]);

  return {
    items,
    total,
    hasMore,
    loading:     busy && items.length === 0,
    loadingMore: busy && items.length > 0,
    loadMore,
  };
}

// ── brands ───────────────────────────────────────────────────────────────────

/** The A–Z index's "no letter picked" state. */
export const ALL_LETTERS = "ALL";

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

    const query: Query = { page, limit: pageSize };
    if (letter !== ALL_LETTERS) query.startsWith = letter;
    if (!haveInitials.current) query.facets = ["initials"];

    fetchPage<RawTaxonomy>("brands", query, abort.signal)
      .then(({ rows, pagination, facets }) => {
        if (abort.signal.aborted) return;
        const mapped = rows.map(toFilterItem);
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
    loadingMore: busy && items.length > 0,
    loadMore,
    letter,
    setLetter,
    initials,
  };
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
    loading:     busy && page === 1,
    loadingMore: busy && page > 1,
    loadMore,
  };
}

export { NON_ALPHA };

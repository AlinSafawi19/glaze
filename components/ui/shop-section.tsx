"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filters } from "./filters";
import { BrandIndex } from "./brand-index";
import { ProductCard } from "./product-card";
import { H4, SubtitleMd } from "./typography";
import { useLoadingGate } from "./loading-gate";
import { SectionLoading } from "./section-loading";
import {
  useBrandIndex,
  useBrandsBySlug,
  useDebounced,
  useFilterOptions,
  useShopProducts,
  type ShopSeed,
} from "./use-shop-data";
import { DESKTOP_PAGE_SIZE } from "@/lib/shop";

/** Products per request on mobile. The grid's "load more" asks for the next page. */
const MOBILE_PAGE_SIZE  = 8;

/** Filter options per request, per group. */
const OPTIONS_PAGE_SIZE = 8;

/** Brand chips per request. Fewer on a phone, where the strip stands between
 *  the shopper and the first product. */
const BRAND_PAGE_SIZE        = 24;
const MOBILE_BRAND_PAGE_SIZE = 12;

/** How long typing settles before the shop asks the server for matches. */
const SEARCH_DEBOUNCE = 300;

/** How long a run of chip clicks settles before the grid asks for matches. */
const FILTER_SETTLE = 180;

const EASE = "cubic-bezier(0.44, 0, 0.56, 1)";

/** Screen sizes the grid can be tuned for, split where the Tailwind tiers are. */
type Tier = "mobile" | "tablet" | "desktop";

/** Products per row the shopper can pick from, per tier. The first is the
 *  default: what the grid showed before there was a choice. */
const COLUMN_OPTIONS: Record<Tier, number[]> = {
  mobile:  [1, 2],
  tablet:  [2, 3],
  desktop: [3, 2, 4],
};

const COLUMNS_KEY = "glaze:shop-columns";

function tierOf(width: number): Tier {
  if (width >= 1200) return "desktop";
  if (width >= 810)  return "tablet";
  return "mobile";
}

function readColumns(): Partial<Record<Tier, number>> {
  try {
    const raw    = window.localStorage.getItem(COLUMNS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * How many products sit in a row, chosen per screen size and remembered: two
 * across on a phone says nothing about what the same shopper wants on a laptop.
 * `tier` is null until mounted, and the grid keeps its responsive classes until
 * then, so the server render and the first paint agree.
 */
function useGridColumns() {
  const [tier,   setTier]   = useState<Tier | null>(null);
  // Read lazily: nothing uses it until `tier` is set after mount, so the
  // server's empty guess never reaches the markup.
  const [chosen, setChosen] = useState<Partial<Record<Tier, number>>>(() =>
    typeof window === "undefined" ? {} : readColumns(),
  );

  useEffect(() => {
    const check = () => setTier(tierOf(window.innerWidth));
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const options = tier ? COLUMN_OPTIONS[tier] : [];
  const pick    = tier ? chosen[tier] : undefined;
  const columns = tier ? (pick && options.includes(pick) ? pick : options[0]) : null;

  const setColumns = useCallback(
    (n: number) => {
      if (!tier) return;
      setChosen((prev) => {
        const next = { ...prev, [tier]: n };
        try {
          window.localStorage.setItem(COLUMNS_KEY, JSON.stringify(next));
        } catch {
          /* storage blocked — the choice still holds for this visit */
        }
        return next;
      });
    },
    [tier],
  );

  // Denser than the tier's default: the cards shrink to suit.
  const compact = tier !== null && columns !== null && columns > COLUMN_OPTIONS[tier][0];

  return { options, columns, setColumns, compact };
}

/** A glyph of `n` bars — the row the button will lay out. */
function ColumnsIcon({ n }: { n: number }) {
  const gap   = 2;
  const width = (16 - gap * (n - 1)) / n;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={i * (width + gap)} y="0" width={width} height="16" fill="currentColor" />
      ))}
    </svg>
  );
}

function ColumnPicker({
  options,
  value,
  onChange,
}: {
  options:  number[];
  value:    number | null;
  onChange: (n: number) => void;
}) {
  if (options.length < 2 || value === null) return null;
  const sorted = [...options].sort((a, b) => a - b);
  return (
    <div role="group" aria-label="Products per row" className="flex flex-row items-center gap-[8px]">
      {sorted.map((n) => {
        const active = n === value;
        return (
          <button
            key={n}
            type="button"
            aria-pressed={active}
            aria-label={`${n} per row`}
            title={`${n} per row`}
            onClick={() => onChange(n)}
            className={`w-[36px] h-[36px] flex justify-center items-center border border-dotted rounded-none cursor-pointer transition-colors duration-300 ${
              active
                ? "bg-blush border-plum text-plum"
                : "bg-transparent border-beige text-beige hover:text-brown"
            }`}
          >
            <ColumnsIcon n={n} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * The one spinner left in the app, and deliberately small: appending the next
 * page is a nudge at the bottom of a grid the shopper is already reading, so it
 * would be wrong to throw the full-screen loader over it. Every other wait is
 * the page loader's job.
 */
function PaginationSpinner() {
  return (
    <div
      className="w-[20px] h-[20px] rounded-full border-[2px] border-beige animate-spin"
      style={{ borderTopColor: "var(--color-brown)" }}
      role="status"
      aria-label="Loading more products"
    />
  );
}

function EmptyState() {
  return (
    <div
      className="w-full min-w-full max-h-full flex flex-col justify-center items-center gap-[10px] p-[10px] overflow-visible rounded-[20px] bg-dusty min-h-[276px]"
      style={{ border: "1px dashed var(--color-beige)" }}
    >
      <SubtitleMd className="!text-brown !text-center">
        No items found for your selection
      </SubtitleMd>
    </div>
  );
}

/** Adds or removes one slug, leaving the rest of the selection alone. */
function toggled(set: Set<string>, slug: string): Set<string> {
  const next = new Set(set);
  if (next.has(slug)) next.delete(slug);
  else next.add(slug);
  return next;
}

/** `?brand=a,b` — the comma-joined spelling the API already takes for lists. */
function splitParam(value: string): string[] {
  return value.split(",").map((slug) => slug.trim()).filter(Boolean);
}

/**
 * A selection that lives in the query string.
 *
 * The catch with holding it there rather than in state is that `router.replace`
 * lands a tick or two after the click, so a second chip ticked before the query
 * catches up would be toggling against the selection as it stood before the
 * first — and the first pick would vanish. The set last written stands in until
 * `?key=` reflects it, which is what makes ticking four brands quickly add four
 * brands.
 */
function useParamSet(
  key:   string,
  raw:   string,
  write: (key: string, values: string[]) => void,
) {
  const selected = useMemo(() => new Set(splitParam(raw)), [raw]);
  const pending  = useRef<{ seen: string; set: Set<string> } | null>(null);

  const commit = useCallback(
    (next: Set<string>) => {
      pending.current = { seen: raw, set: next };
      write(key, [...next]);
    },
    [key, raw, write],
  );

  const toggle = useCallback(
    (slug: string) => {
      const held = pending.current;
      const base = held && held.seen === raw ? held.set : selected;
      commit(toggled(base, slug));
    },
    [commit, raw, selected],
  );

  const clear = useCallback(() => commit(new Set()), [commit]);

  return { selected, toggle, clear, commit };
}

export function ShopSection({ collectionSlug, seed }: { collectionSlug?: string; seed?: ShopSeed } = {}) {
  const [isMobile, setIsMobile] = useState(false);
  const grid = useGridColumns();

  // Filter state. Slugs throughout: they are what the API filters on, what the
  // shop's own links carry, and what a deep link can apply before any list has
  // finished loading.
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const collectionParam = searchParams.get("collection") ?? "";
  const brandParam      = searchParams.get("brand") ?? "";
  const categoryParam   = searchParams.get("category") ?? "";

  const searchParam     = searchParams.get("q") ?? "";

  // `?q=` comes from the header's search. It seeds the sidebar's box rather
  // than owning it: typing there refines the grid without rewriting the URL on
  // every keystroke, and a fresh search from the header replaces it.
  const [searchValue,        setSearchValue]        = useState(searchParam);
  const [seenSearchParam,    setSeenSearchParam]    = useState(searchParam);
  if (seenSearchParam !== searchParam) {
    setSeenSearchParam(searchParam);
    setSearchValue(searchParam);
  }
  const [selectedSkinTypes,  setSelectedSkinTypes]  = useState<Set<string>>(new Set());

  // Several keys in one write: two back-to-back replaces would each start from
  // the same stale query, and the second would put back what the first cleared.
  const setParams = useCallback(
    (updates: Record<string, string[]>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, values] of Object.entries(updates)) {
        if (values.length > 0) params.set(key, values.join(","));
        else params.delete(key);
      }

      const query = params.toString();
      // `replace`, not `push`: ticking five brands should not cost five presses
      // of the back button to get out of the shop. `scroll: false` because the
      // shopper is mid-page and the selection is not a new page.
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setParam = useCallback(
    (key: string, values: string[]) => setParams({ [key]: values }),
    [setParams],
  );

  // `?brand=`, `?category=` and `?collection=` *are* the selection rather than a seed for one.
  // Reading them straight through means the first render is already filtered, a
  // refresh or a shared link lands on the shop the shopper was looking at, and
  // picking the same brand from the header twice is no longer a dead click
  // against a value that never changed.
  const brandPicks      = useParamSet("brand",      brandParam,      setParam);
  const collectionPicks = useParamSet("collection", collectionParam, setParam);
  const categoryPicks   = useParamSet("category",   categoryParam,   setParam);

  const selectedBrands      = brandPicks.selected;
  const selectedCollections = collectionPicks.selected;
  const selectedCategories  = categoryPicks.selected;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 810);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const brandSlugs  = useMemo(() => [...selectedBrands], [selectedBrands]);
  const brandLookup = useBrandsBySlug(brandSlugs);

  // A slug with no brand behind it filters every product out and shows as a
  // count with nothing under it. Once the server has actually answered for it -
  // a lookup that merely failed says nothing - drop it, so a stale link opens
  // the shop rather than an empty grid the shopper cannot account for.
  useEffect(() => {
    if (brandLookup.unknown.length === 0) return;
    const bad  = new Set(brandLookup.unknown);
    const keep = brandSlugs.filter((slug) => !bad.has(slug));
    // Nothing left to drop: stop, rather than rewriting the same query forever.
    if (keep.length === brandSlugs.length) return;
    brandPicks.commit(new Set(keep));
  }, [brandLookup.unknown, brandSlugs, brandPicks]);

  // The header menu deep-links to `#shop`. This section renders inside Suspense,
  // so the anchor can be missing when the router first looks for it - and a
  // second pick from the menu is only a query change, with no remount at all.
  //
  // A brand or category picked from the menu is about the products it
  // filtered, so that lands on the grid rather than on the wall of chips it was picked from. The
  // chip toggles below rewrite the query without the hash, which is what keeps
  // this from firing again on every tick.
  useEffect(() => {
    if (window.location.hash !== "#shop") return;
    const target = brandParam || categoryParam || searchParam ? "products" : "shop";
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams, brandParam, categoryParam, searchParam]);

  const categories  = useFilterOptions("categories",  OPTIONS_PAGE_SIZE);
  const collections = useFilterOptions("collections", OPTIONS_PAGE_SIZE);
  const skinTypes   = useFilterOptions("skin-types",  OPTIONS_PAGE_SIZE);
  const brandIndex  = useBrandIndex(isMobile ? MOBILE_BRAND_PAGE_SIZE : BRAND_PAGE_SIZE);

  const search   = useDebounced(searchValue, SEARCH_DEBOUNCE);
  const pageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;

  // A page pinned to one collection narrows to it outright; elsewhere the
  // shopper's own picks decide.
  const collectionFilter = useMemo(
    () => (collectionSlug ? [collectionSlug] : [...selectedCollections]),
    [collectionSlug, selectedCollections],
  );

  // Ticking is faster than fetching: letting a run of picks settle turns four
  // clicks into one request rather than three that are aborted on the way out.
  const picks = useMemo(
    () => ({
      categories:  [...selectedCategories],
      brands:      brandSlugs,
      collections: collectionFilter,
      skinTypes:   [...selectedSkinTypes],
    }),
    [selectedCategories, brandSlugs, collectionFilter, selectedSkinTypes],
  );

  const settled = useDebounced(picks, FILTER_SETTLE);

  const filters = useMemo(() => ({ search, ...settled }), [search, settled]);

  const products = useShopProducts(filters, pageSize, collectionSlug ? undefined : seed);

  // The shop is the page - hold the loader up rather than filling the grid with
  // a spinner. Only while there is nothing to show: a filter change over a grid
  // already on screen is a refresh, and dims in place.
  useLoadingGate(products.loading);

  // The panel's own groups, and only those. Brands are picked above the shop and
  // cleared there - a button in the sidebar reaching up to deselect chips in
  // another part of the page was the surprise, not the convenience.
  function handleClear() {
    setSearchValue("");
    setSelectedSkinTypes(new Set());
    setParams({ category: [], collection: [], q: [] });
  }

  return (
    <section id="shop" className="relative w-full flex flex-col justify-start items-center gap-[10px] scroll-mt-[60px] tablet:scroll-mt-[68px] desktop:scroll-mt-[72px] p-0 overflow-visible rounded-none bg-caledon z-[10]">

      {/* Container */}
      <div className="w-full max-w-[1920px] flex flex-col justify-start items-center
        gap-[24px] pt-[32px] px-[16px] pb-[48px]
        tablet:gap-[40px] tablet:pt-[48px] tablet:px-[24px] tablet:pb-[64px]
        desktop:pt-[64px] desktop:px-[32px] desktop:pb-[80px]">

        {/* Brands — an A–Z index above the shop, not a sidebar checkbox list */}
        <BrandIndex
          data={brandIndex}
          selected={selectedBrands}
          selectedItems={brandLookup.items}
          onToggle={brandPicks.toggle}
          onClear={brandPicks.clear}
        />

        {/* Title wrapper */}
        <div className="w-full flex flex-row justify-between items-center gap-[16px] p-0 overflow-visible rounded-none">
          <H4 className="w-auto h-auto !text-beige !text-left">Products</H4>
          <ColumnPicker options={grid.options} value={grid.columns} onChange={grid.setColumns} />
        </div>

        {/* Shop */}
        <div className="w-full flex flex-col tablet:flex-row justify-start items-start overflow-visible rounded-none
          gap-[32px]
          tablet:gap-[24px]
          desktop:gap-[32px]">

          {/* Filters sidebar */}
          <div className="sticky top-[60px] tablet:top-[68px] desktop:top-[72px] self-start w-[calc(100%+32px)] -mx-[16px] tablet:w-auto tablet:mx-0 z-[20] tablet:z-auto">
            <Filters
              categories={categories}
              collections={collections}
              skinTypes={skinTypes}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              selectedCategories={selectedCategories}
              onCategoryToggle={categoryPicks.toggle}
              onCategoryAll={categoryPicks.clear}
              selectedCollections={selectedCollections}
              onCollectionToggle={collectionPicks.toggle}
              onCollectionAll={collectionPicks.clear}
              selectedSkinTypes={selectedSkinTypes}
              onSkinTypeToggle={(slug) => setSelectedSkinTypes((prev) => toggled(prev, slug))}
              onSkinTypeAll={() => setSelectedSkinTypes(new Set())}
              onClear={handleClear}
            />
          </div>

          {/* Products area — its own anchor, so a brand picked from the header
              lands on what it filtered rather than on the index above. */}
          <div
            id="products"
            className="flex-1 flex flex-col gap-[40px] w-full scroll-mt-[60px] tablet:scroll-mt-[68px] desktop:scroll-mt-[72px]"
          >

            {products.loading ? <SectionLoading /> : products.items.length === 0 ? (
              <EmptyState />
            ) : (
              <div
                aria-busy={products.refreshing}
                // A filter change dims the grid it is about to replace rather
                // than tearing it down for half a screen of wordmark: the
                // shopper keeps their place, and the page keeps its height.
                // Once mounted, the shopper's pick overrides the responsive default.
                style={{
                  opacity: products.refreshing ? 0.45 : 1,
                  transition: `opacity 0.3s ${EASE}`,
                  ...(grid.columns && { gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))` }),
                }}
                className="grid
                grid-cols-1 gap-x-[16px] gap-y-[48px]
                tablet:grid-cols-2 tablet:gap-y-[40px]
                desktop:grid-cols-3 desktop:gap-y-[48px]">
                {products.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    title={product.title}
                    price={product.price}
                    discount={product.discount}
                    imageSrc={product.imageSrc}
                    slug={product.slug}
                    stock={product.stock}
                    href={`/products/${product.slug}`}
                    className="!w-full"
                    compact={grid.compact}
                  />
                ))}
              </div>
            )}

            {/* Load more — the next page of the current selection, from the server */}
            {products.hasMore && !products.loading && (
              <div className="w-full flex justify-center">
                {products.loadingMore ? (
                  <PaginationSpinner />
                ) : (
                  <button
                    onClick={products.loadMore}
                    className="font-clash font-medium clash-features uppercase text-brown text-[14px] leading-[1.4] border border-dashed border-beige px-[32px] py-[12px] rounded-none bg-transparent cursor-pointer"
                    style={{ transition: "border-color 0.3s cubic-bezier(0.44,0,0.56,1)" }}
                  >
                    Load more
                  </button>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

    </section>
  );
}

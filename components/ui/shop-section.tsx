"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { categorySlugs, relationSlug, skinTypeSlugs, type Relation, type RawRelations } from "@/lib/relations";
import { parseStock } from "@/lib/stock";
import { Filters, type FilterItem } from "./filters";
import { BrandIndex } from "./brand-index";
import { ProductCard } from "./product-card";
import { H4, SubtitleMd } from "./typography";
import { fetchAll, endpoint } from "@/lib/api";
import { useLoadingGate, whenImagesSettled } from "./loading-gate";
import { SectionLoading } from "./section-loading";

const CATEGORIES_URL = endpoint("categories");
const BRANDS_URL     = endpoint("brands");
const COLLECTIONS_URL= endpoint("collections");
const SKIN_TYPES_URL = endpoint("skin-types");
const PRODUCTS_URL   = endpoint("products");

interface RawProduct extends RawRelations {
  id:              string;
  Slug:            string;
  Title:           string;
  "Cover img 1":   string;
  Price:           string;
  Discount:        string;
  Brand:           Relation;
  Collections:     Relation;
  Stock?:          string;
}

interface Product {
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

const DESKTOP_PAGE_SIZE = 12;
const MOBILE_PAGE_SIZE  = 8;

/**
 * A list the dashboard does not have yet just yields no filter — never a dead
 * page. Every page is walked: the endpoint hands back 20 rows unasked, so a
 * shop with more than twenty brands was quietly losing the rest.
 */
async function fetchFilterItems(url: string, signal?: AbortSignal): Promise<FilterItem[]> {
  const rows = await fetchAll<{ id: string; Title: string; Slug: string }>(url, { signal });
  return rows.map((e) => ({ id: e.id, name: e.Title, slug: e.Slug }));
}

function toProduct(e: RawProduct): Product {
  return {
    id:          e.id,
    slug:        e.Slug,
    title:       e.Title,
    price:       parseFloat(e.Price)        || 0,
    discount:    parseFloat(e.Discount)     || 0,
    imageSrc:    e["Cover img 1"],
    stock:       parseStock(e.Stock),
    categories:  categorySlugs(e),
    brand:       relationSlug(e.Brand),
    collections: relationSlug(e.Collections),
    skinTypes:   skinTypeSlugs(e),
  };
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

/**
 * Tick the filter box named by a URL param once its list has loaded. Only fires
 * per distinct param value, so the shopper can untick it again and it stays off.
 */
function useParamSelection(
  param: string,
  items: FilterItem[],
  select: (ids: Set<string>) => void,
) {
  const applied = useRef("");

  useEffect(() => {
    if (!param || items.length === 0) return;
    if (applied.current === param) return;
    const match = items.find((i) => i.slug === param);
    if (!match) return;
    applied.current = param;
    select(new Set([match.id]));
  }, [param, items, select]);
}

export function ShopSection({ collectionSlug }: { collectionSlug?: string } = {}) {
  const [categories,          setCategories]          = useState<FilterItem[]>([]);
  const [brands,              setBrands]              = useState<FilterItem[]>([]);
  const [collections,         setCollections]         = useState<FilterItem[]>([]);
  const [skinTypes,           setSkinTypes]           = useState<FilterItem[]>([]);
  const [allProducts,         setAllProducts]         = useState<Product[]>([]);
  const [loading,             setLoading]             = useState(true);
  const [page,                setPage]                = useState(1);
  const [appending,           setAppending]           = useState(false);
  const [isMobile,            setIsMobile]            = useState(false);

  // Filter state
  const [searchValue,         setSearchValue]         = useState("");
  const [selectedCategories,  setSelectedCategories]  = useState<Set<string>>(new Set());
  const [selectedBrands,      setSelectedBrands]      = useState<Set<string>>(new Set());
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [selectedSkinTypes,   setSelectedSkinTypes]   = useState<Set<string>>(new Set());

  // `/shop-all?collection=<slug>` and `?brand=<slug>` arrive pre-filtered —
  // the Offers CTA and the header Brands menu respectively.
  const searchParams = useSearchParams();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 810);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);

    (async () => {
      // The sidebar first: it is what the shopper reaches for, and the four
      // lists together are a fraction of the catalogue's weight.
      const [cats, brnds, cols, skins] = await Promise.all([
        fetchFilterItems(CATEGORIES_URL,  abort.signal),
        fetchFilterItems(BRANDS_URL,      abort.signal),
        fetchFilterItems(COLLECTIONS_URL, abort.signal),
        fetchFilterItems(SKIN_TYPES_URL,  abort.signal),
      ]);
      if (abort.signal.aborted) return;
      setCategories(cats);
      setBrands(brnds);
      setCollections(cols);
      setSkinTypes(skins);

      // Products arrive a page at a time and are shown as they land, so the
      // shop opens on its first hundred rather than waiting out a catalogue
      // that could run to thousands. Only the rows this page added are mapped,
      // which keeps the walk linear rather than quadratic.
      const mapped: Product[] = [];
      await fetchAll<RawProduct>(PRODUCTS_URL, {
        signal: abort.signal,
        onPage: (rowsSoFar) => {
          if (abort.signal.aborted) return;
          mapped.push(...rowsSoFar.slice(mapped.length).map(toProduct));
          setAllProducts([...mapped]);
          setLoading(false);
        },
      });
    })()
      .catch(() => { /* fetchAll keeps what arrived; nothing to recover here. */ })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });

    return () => abort.abort();
  }, []);

  // The shop is the page — hold the loader up rather than filling the grid with
  // a spinner.
  useLoadingGate(loading);

  // Load more: the extra rows are already in memory, so the spinner is really
  // waiting on their imagery. A short floor keeps it from strobing when the
  // pictures come straight out of cache.
  useEffect(() => {
    if (!appending) return;
    const abort = new AbortController();
    Promise.all([
      whenImagesSettled(abort.signal, 2000),
      new Promise((r) => setTimeout(r, 350)),
    ]).then(() => {
      if (!abort.signal.aborted) setAppending(false);
    });
    return () => abort.abort();
  }, [appending, page]);

  // Build lookup maps: slug â†’ id
  const categorySlugToId = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => { m[c.slug] = c.id; });
    return m;
  }, [categories]);

  const brandSlugToId = useMemo(() => {
    const m: Record<string, string> = {};
    brands.forEach((b) => { m[b.slug] = b.id; });
    return m;
  }, [brands]);

  const collectionSlugToId = useMemo(() => {
    const m: Record<string, string> = {};
    collections.forEach((c) => { m[c.slug] = c.id; });
    return m;
  }, [collections]);

  const skinTypeSlugToId = useMemo(() => {
    const m: Record<string, string> = {};
    skinTypes.forEach((s) => { m[s.slug] = s.id; });
    return m;
  }, [skinTypes]);

  useParamSelection(searchParams.get("collection") ?? "", collections, setSelectedCollections);
  useParamSelection(searchParams.get("brand")      ?? "", brands,      setSelectedBrands);

  // The header menu deep-links to `#shop`. This section renders inside Suspense,
  // so the anchor can be missing when the router first looks for it — and a
  // second pick from the menu is only a query change, with no remount at all.
  useEffect(() => {
    if (window.location.hash !== "#shop") return;
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return allProducts.filter((p) => {
      if (collectionSlug && p.collections !== collectionSlug) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      if (selectedCategories.size > 0) {
        // A product qualifies on any one of the categories it is filed under.
        const ids = p.categories.map((c) => categorySlugToId[c]).filter(Boolean);
        if (!ids.some((id) => selectedCategories.has(id))) return false;
      }
      if (selectedBrands.size > 0) {
        const brandId = brandSlugToId[p.brand];
        if (!brandId || !selectedBrands.has(brandId)) return false;
      }
      if (selectedCollections.size > 0) {
        const colId = collectionSlugToId[p.collections];
        if (!colId || !selectedCollections.has(colId)) return false;
      }
      if (selectedSkinTypes.size > 0) {
        // A product qualifies on any one of the skin types it is tagged with.
        const ids = p.skinTypes.map((s) => skinTypeSlugToId[s]).filter(Boolean);
        if (!ids.some((id) => selectedSkinTypes.has(id))) return false;
      }
      return true;
    });
  }, [allProducts, collectionSlug, searchValue, selectedCategories, selectedBrands, selectedCollections, selectedSkinTypes, categorySlugToId, brandSlugToId, collectionSlugToId, skinTypeSlugToId]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [searchValue, selectedCategories, selectedBrands, selectedCollections, selectedSkinTypes]);

  const pageSize  = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
  const paginated = filtered.slice(0, page * pageSize);
  const hasMore   = filtered.length > page * pageSize;

  function handleCategoryToggle(id: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBrandToggle(id: string) {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleCollectionToggle(id: string) {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSkinTypeToggle(id: string) {
    setSelectedSkinTypes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleClear() {
    setSearchValue("");
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setSelectedCollections(new Set());
    setSelectedSkinTypes(new Set());
  }

  return (
    <section id="shop" className="relative w-full flex flex-col justify-start items-center gap-[10px] scroll-mt-[60px] tablet:scroll-mt-[68px] desktop:scroll-mt-[72px] p-0 overflow-visible rounded-none bg-caledon z-[10]">

      {/* Container */}
      <div className="w-full max-w-[1920px] flex flex-col justify-start items-center
        gap-[24px] pt-[32px] px-[16px] pb-[48px]
        tablet:gap-[40px] tablet:pt-[48px] tablet:px-[24px] tablet:pb-[64px]
        desktop:pt-[64px] desktop:px-[32px] desktop:pb-[80px]">

        {/* Brands — an A–Z index above the shop, not a sidebar checkbox list */}
        {!loading && (
          <BrandIndex
            brands={brands}
            selected={selectedBrands}
            onToggle={handleBrandToggle}
            onClear={() => setSelectedBrands(new Set())}
          />
        )}

        {/* Title wrapper */}
        <div className="w-full flex flex-row justify-start items-center gap-[16px] p-0 overflow-visible rounded-none">
          <H4 className="w-auto h-auto !text-beige !text-left">Products</H4>
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
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
              onCategoryAll={() => setSelectedCategories(new Set())}
              selectedCollections={selectedCollections}
              onCollectionToggle={handleCollectionToggle}
              onCollectionAll={() => setSelectedCollections(new Set())}
              skinTypes={skinTypes}
              selectedSkinTypes={selectedSkinTypes}
              onSkinTypeToggle={handleSkinTypeToggle}
              onSkinTypeAll={() => setSelectedSkinTypes(new Set())}
              onClear={handleClear}
            />
          </div>

          {/* Products area */}
          <div className="flex-1 flex flex-col gap-[40px] w-full">

            {loading ? <SectionLoading /> : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid
                grid-cols-1 gap-x-[16px] gap-y-[48px]
                tablet:grid-cols-2 tablet:gap-y-[40px]
                desktop:grid-cols-3 desktop:gap-y-[48px]">
                {paginated.map((product) => (
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
                  />
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && !loading && (
              <div className="w-full flex justify-center">
                {appending ? (
                  <PaginationSpinner />
                ) : (
                  <button
                    onClick={() => { setAppending(true); setPage((p) => p + 1); }}
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

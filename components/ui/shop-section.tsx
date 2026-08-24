"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filters } from "./filters";
import { BrandIndex } from "./brand-index";
import { ProductCard } from "./product-card";
import { H4, SubtitleMd } from "./typography";
import { useLoadingGate } from "./loading-gate";
import { SectionLoading } from "./section-loading";
import {
  useBrandIndex,
  useDebounced,
  useFilterOptions,
  useShopProducts,
} from "./use-shop-data";

/** Products per request. The grid's "load more" asks for the next page. */
const DESKTOP_PAGE_SIZE = 12;
const MOBILE_PAGE_SIZE  = 8;

/** Filter options per request, per group. */
const OPTIONS_PAGE_SIZE = 8;

/** Brand chips per request. */
const BRAND_PAGE_SIZE = 24;

/** How long typing settles before the shop asks the server for matches. */
const SEARCH_DEBOUNCE = 300;

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

export function ShopSection({ collectionSlug }: { collectionSlug?: string } = {}) {
  const [isMobile, setIsMobile] = useState(false);

  // Filter state. Slugs throughout: they are what the API filters on, what the
  // shop's own links carry, and what a deep link can apply before any list has
  // finished loading.
  // `/shop-all?collection=<slug>` and `?brand=<slug>` arrive pre-filtered - the
  // collection strips and the header Brands menu respectively.
  const searchParams    = useSearchParams();
  const collectionParam = searchParams.get("collection") ?? "";
  const brandParam      = searchParams.get("brand") ?? "";

  const [searchValue,         setSearchValue]         = useState("");
  const [selectedCategories,  setSelectedCategories]  = useState<Set<string>>(new Set());
  const [selectedSkinTypes,   setSelectedSkinTypes]   = useState<Set<string>>(new Set());

  // A deep link is the opening selection rather than something applied on top of
  // an empty one: the first render is already filtered, so the shop never shows
  // an unfiltered page and then swaps it out. Slugs go straight in - unlike the
  // old id-keyed state, this does not have to wait for a list to load.
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(
    () => new Set(brandParam ? [brandParam] : []),
  );
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    () => new Set(collectionParam ? [collectionParam] : []),
  );

  // Picking another brand from the header only rewrites the query, with no
  // remount to pick the new value up - so a later change is applied here, once
  // per distinct value, leaving the shopper free to untick it again.
  const [seenBrand, setSeenBrand] = useState(brandParam);
  if (seenBrand !== brandParam) {
    setSeenBrand(brandParam);
    if (brandParam) setSelectedBrands(new Set([brandParam]));
  }

  const [seenCollection, setSeenCollection] = useState(collectionParam);
  if (seenCollection !== collectionParam) {
    setSeenCollection(collectionParam);
    if (collectionParam) setSelectedCollections(new Set([collectionParam]));
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 810);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // The header menu deep-links to `#shop`. This section renders inside Suspense,
  // so the anchor can be missing when the router first looks for it - and a
  // second pick from the menu is only a query change, with no remount at all.
  useEffect(() => {
    if (window.location.hash !== "#shop") return;
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  const categories  = useFilterOptions("categories",  OPTIONS_PAGE_SIZE);
  const collections = useFilterOptions("collections", OPTIONS_PAGE_SIZE);
  const skinTypes   = useFilterOptions("skin-types",  OPTIONS_PAGE_SIZE);
  const brandIndex  = useBrandIndex(BRAND_PAGE_SIZE);

  const search   = useDebounced(searchValue, SEARCH_DEBOUNCE);
  const pageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;

  // A page pinned to one collection narrows to it outright; elsewhere the
  // shopper's own picks decide.
  const collectionFilter = useMemo(
    () => (collectionSlug ? [collectionSlug] : [...selectedCollections]),
    [collectionSlug, selectedCollections],
  );

  const filters = useMemo(
    () => ({
      search,
      categories:  [...selectedCategories],
      brands:      [...selectedBrands],
      collections: collectionFilter,
      skinTypes:   [...selectedSkinTypes],
    }),
    [search, selectedCategories, selectedBrands, collectionFilter, selectedSkinTypes],
  );

  const products = useShopProducts(filters, pageSize);

  // The shop is the page - hold the loader up rather than filling the grid with
  // a spinner. First page only: later ones append under a nudge of their own.
  useLoadingGate(products.loading);

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
        <BrandIndex
          data={brandIndex}
          selected={selectedBrands}
          onToggle={(slug) => setSelectedBrands((prev) => toggled(prev, slug))}
          onClear={() => setSelectedBrands(new Set())}
        />

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
              skinTypes={skinTypes}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              selectedCategories={selectedCategories}
              onCategoryToggle={(slug) => setSelectedCategories((prev) => toggled(prev, slug))}
              onCategoryAll={() => setSelectedCategories(new Set())}
              selectedCollections={selectedCollections}
              onCollectionToggle={(slug) => setSelectedCollections((prev) => toggled(prev, slug))}
              onCollectionAll={() => setSelectedCollections(new Set())}
              selectedSkinTypes={selectedSkinTypes}
              onSkinTypeToggle={(slug) => setSelectedSkinTypes((prev) => toggled(prev, slug))}
              onSkinTypeAll={() => setSelectedSkinTypes(new Set())}
              onClear={handleClear}
            />
          </div>

          {/* Products area */}
          <div className="flex-1 flex flex-col gap-[40px] w-full">

            {products.loading ? <SectionLoading /> : products.items.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid
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

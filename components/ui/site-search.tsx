"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";

import { fetchPage } from "@/lib/api";
import { BodySm, ButtonSm, SubtitleSm } from "./typography";
import { ProductImage } from "./product-image";
import { toProduct, useDebounced, type Product, type RawProduct } from "./use-shop-data";
import { useScrollLock } from "./use-scroll-lock";

const EASE  = [0.44, 0, 0.56, 1] as const;
const PANEL = { duration: 0.45, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] };

/** Long enough to skip the keystrokes in the middle of a word. */
const SEARCH_DEBOUNCE = 250;
/** A preview, not the shop — the rest is one "See all" away. */
const PREVIEW_SIZE = 6;
/** Brands that match are shown as a short row of shortcuts above the products. */
const BRAND_PREVIEW_SIZE = 4;

interface BrandHit {
  id:   string;
  name: string;
  slug: string;
}

interface Results {
  /** The term these results answer, which can trail the one being typed. */
  term:     string;
  products: Product[];
  brands:   BrandHit[];
  total:    number;
}

/** Where "See all" and Enter land: the shop, filtered by the same term. */
export function searchHref(term: string): string {
  const q = term.trim();
  return q ? `/shop-all?q=${encodeURIComponent(q)}#shop` : "/shop-all#shop";
}

/**
 * Live results for a term — a page of products and the brands whose names
 * match. Both are searched in the database, so typing costs two small requests
 * per pause rather than downloading the catalogue to filter it here.
 */
function useSearchResults(term: string) {
  const [results, setResults] = useState<Results | null>(null);
  /** The term whose request failed, so a later term starts with a clean slate. */
  const [failed,  setFailed]  = useState<string | null>(null);
  const q = term.trim();

  useEffect(() => {
    if (!q) return;
    const abort = new AbortController();

    Promise.all([
      fetchPage<RawProduct>("products", { search: q, limit: PREVIEW_SIZE }, abort.signal),
      fetchPage<{ id: string; Title: string; Slug: string }>(
        "brands",
        { search: q, limit: BRAND_PREVIEW_SIZE, sort: "name" },
        abort.signal,
      ).catch(() => null), // no brand row is no reason to hide the products
    ])
      .then(([products, brands]) => {
        if (abort.signal.aborted) return;
        setResults({
          term:     q,
          products: products.rows.map(toProduct),
          brands:   (brands?.rows ?? []).map((b) => ({ id: b.id, name: b.Title, slug: b.Slug })),
          total:    products.pagination.total,
        });
      })
      .catch(() => { if (!abort.signal.aborted) setFailed(q); });

    return () => abort.abort();
  }, [q]);

  // The last answer stays up, dimmed, while the next is in flight — a list
  // that blinks out on every keystroke is harder to read than a stale one.
  return {
    results: q && failed !== q ? results : null,
    loading: Boolean(q) && results?.term !== q && failed !== q,
    failed:  Boolean(q) && failed === q,
  };
}

function SearchIcon({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center justify-center w-[30px] h-[42px] tablet:w-[43px] tablet:h-[43px] desktop:w-[44px] desktop:h-[44px] rounded-none bg-transparent border-none cursor-pointer"
    >
      <motion.span
        className="flex items-center justify-center"
        animate={{ scale: hovered ? 1.08 : 1 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <Search
          strokeWidth={1.5}
          className={`${hovered ? "text-plum" : "text-brown"} w-[21px] h-[21px] tablet:w-[22px] tablet:h-[22px] desktop:w-[23px] desktop:h-[23px]`}
          style={{ transition: "color 0.3s cubic-bezier(0.44,0,0.56,1)" }}
        />
      </motion.span>
    </button>
  );
}

function ResultRow({ product, onNavigate }: { product: Product; onNavigate: () => void }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={onNavigate}
      className="w-full flex flex-row justify-start items-center gap-[14px] p-[8px] rounded-none transition-colors duration-300 ease-[cubic-bezier(0.44,0,0.56,1)] hover:bg-blush focus-visible:bg-blush focus:outline-none"
    >
      <span className="relative block shrink-0 w-[56px] h-[68px] overflow-clip bg-dusty">
        <ProductImage src={product.imageSrc} alt={product.title} sizes="56px" compact />
      </span>
      <span className="min-w-0 grow flex flex-col justify-center items-start gap-[4px]">
        <SubtitleSm className="w-full !text-black !text-left truncate">{product.title}</SubtitleSm>
        <BodySm className="!text-brown !text-left">${product.price}</BodySm>
      </span>
    </Link>
  );
}

/**
 * The header's search: an icon that opens a panel dropping from the top of the
 * page, with results as the shopper types. A product jumps straight to its
 * page; Enter or "See all" opens the shop filtered by the same term, where the
 * rest of the filters still apply.
 */
export function SiteSearch() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const settled = useDebounced(term, SEARCH_DEBOUNCE);
  const { results, loading, failed } = useSearchResults(open ? settled : "");

  const close = () => setOpen(false);

  // The overlay is portalled to <body>: the header's backdrop-filter makes it
  // the containing block for `fixed` children, which would pin the "full
  // screen" backdrop inside the header bar. False on the server and during
  // hydration, so the markup matches.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  useScrollLock(open);

  // A jump to another page closes the panel behind it.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }

  // "/" opens search from anywhere that is not already taking text; Escape
  // closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    setOpen(false);
    router.push(searchHref(term));
  }

  const q = term.trim();
  const stale = loading || q !== settled.trim();

  return (
    <>
      <SearchIcon onClick={() => setOpen(true)} />

      {mounted && createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            key="site-search"
            className="fixed inset-0 z-[200]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 1, transition: { duration: PANEL.duration } }}
          >
            <motion.div
              className="absolute inset-0 bg-brown/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              onClick={close}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              className="absolute top-0 left-0 right-0 max-h-[100dvh] flex flex-col bg-lavender border-b border-dashed border-beige rounded-none"
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={PANEL}
              onAnimationComplete={() => inputRef.current?.focus()}
            >
              <div className="w-full max-w-[880px] mx-auto flex flex-col min-h-0
                gap-[16px] px-[16px] pt-[14px] pb-[20px]
                tablet:gap-[20px] tablet:px-[24px] tablet:pt-[20px] tablet:pb-[28px]">

                <form onSubmit={submit} role="search" className="w-full flex flex-row items-center gap-[8px]">
                  <div className="relative grow">
                    <input
                      ref={inputRef}
                      type="search"
                      autoFocus
                      enterKeyHint="search"
                      placeholder="Search products and brands…"
                      aria-label="Search products and brands"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full h-[48px] font-inter font-normal text-black text-[16px] bg-white border border-beige rounded-none pl-[44px] pr-[12px] placeholder:text-brown focus:outline-none focus:border-black [&::-webkit-search-cancel-button]:hidden"
                      style={{ lineHeight: "1.2em", transition: "border-color 0.3s cubic-bezier(0.44, 0, 0.56, 1)" }}
                    />
                    <Search size={18} strokeWidth={1.5} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-brown pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close search"
                    className="flex items-center justify-center w-[44px] h-[44px] -mr-[8px] shrink-0 rounded-none bg-transparent border-none cursor-pointer text-brown hover:text-plum"
                  >
                    <X size={22} strokeWidth={1.5} />
                  </button>
                </form>

                {q && (
                  <div
                    className={`w-full min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-[16px] transition-opacity duration-300 ${stale && results ? "opacity-60" : "opacity-100"}`}
                    aria-live="polite"
                    aria-busy={stale}
                  >
                    {results && results.brands.length > 0 && (
                      <div className="w-full flex flex-col gap-[8px]">
                        <SubtitleSm className="!text-brown !text-left">Brands</SubtitleSm>
                        <div className="w-full flex flex-row flex-wrap gap-[8px]">
                          {results.brands.map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/shop-all?brand=${brand.slug}#shop`}
                              onClick={close}
                              className="px-[12px] py-[6px] border border-dashed border-beige rounded-none transition-colors duration-300 hover:bg-blush"
                            >
                              <ButtonSm className="!text-[14px] !text-brown !normal-case">{brand.name}</ButtonSm>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {results && results.products.length > 0 && (
                      <div className="w-full flex flex-col gap-[4px]">
                        <SubtitleSm className="!text-brown !text-left pb-[4px]">Products</SubtitleSm>
                        {results.products.map((product) => (
                          <ResultRow key={product.id} product={product} onNavigate={close} />
                        ))}
                      </div>
                    )}

                    {stale && !results && !failed && (
                      <BodySm className="!text-brown !text-left py-[8px]">Searching…</BodySm>
                    )}

                    {failed && (
                      <BodySm className="!text-brown !text-left py-[8px]">Search is unavailable right now. Please try again.</BodySm>
                    )}

                    {!stale && results && results.products.length === 0 && results.brands.length === 0 && (
                      <BodySm className="!text-brown !text-left py-[8px]">
                        Nothing matches “{results.term}”. Try a brand, an ingredient or a product type.
                      </BodySm>
                    )}

                    {results && results.total > 0 && (
                      <Link
                        href={searchHref(results.term)}
                        onClick={close}
                        className="self-start flex flex-row items-center gap-[8px] px-[12px] py-[8px] bg-plum rounded-none"
                      >
                        <ButtonSm className="!text-lavender">
                          {results.total > results.products.length
                            ? `See all ${results.total} results`
                            : "View in shop"}
                        </ButtonSm>
                        <ArrowRight size={16} strokeWidth={1.5} className="text-lavender" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </>
  );
}

function noop() {
  return () => {};
}

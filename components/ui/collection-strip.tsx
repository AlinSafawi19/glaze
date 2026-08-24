"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { H4, ItalicBodySm } from "./typography";
import { OutlineButton } from "./button";
import { ProductCard } from "./product-card";
import { useLoadingGate } from "./loading-gate";
import { relationSlug, type Relation } from "@/lib/relations";
import { fetchRows, MAX_PAGE_SIZE } from "@/lib/api";
import { parseStock } from "@/lib/stock";


interface RawProduct {
  id:            string;
  Slug:          string;
  Title:         string;
  "Cover img 1": string;
  Price:         string;
  Discount:      string;
  Collections:   Relation;
  Stock?:        string;
}

interface RawCollection {
  Slug:  string;
  Title: string;
}

interface StripProduct {
  id:         string;
  slug:       string;
  title:      string;
  price:      number;
  discount:   number;
  imageSrc:   string;
  stock:      number | null;
  collection: string;
}

/** How many products a strip shows before "see all". */
const STRIP_SIZE = 8;

/**
 * The collection list, shared by every strip on the page.
 *
 * Only the headings: each strip fetches its own products, so this is a short
 * list of names rather than a catalogue, and one request covers all of them.
 */
let collectionsCache: Promise<RawCollection[]> | null = null;

function loadCollections(): Promise<RawCollection[]> {
  if (!collectionsCache) {
    collectionsCache = fetchRows<RawCollection>("collections", { limit: MAX_PAGE_SIZE })
      .catch(() => {
        collectionsCache = null; // let the next mount try again
        return [];
      });
  }
  return collectionsCache;
}

function toStripProduct(e: RawProduct): StripProduct {
  return {
    id:         e.id,
    slug:       e.Slug,
    title:      e.Title,
    price:      parseFloat(e.Price)    || 0,
    discount:   parseFloat(e.Discount) || 0,
    imageSrc:   e["Cover img 1"],
    stock:      parseStock(e.Stock),
    collection: relationSlug(e.Collections),
  };
}

/**
 * One strip's products, asked for by collection.
 *
 * The filter is the server's, so a strip costs the eight rows it shows however
 * large the catalogue is - and a collection whose products sit deep in the
 * table is no longer a strip that renders empty.
 */
function useStripProducts(collectionSlug: string) {
  // Null means "still asking". A strip with no collection behind it has nothing
  // to ask for, so it starts settled and empty.
  const [products, setProducts] = useState<StripProduct[] | null>(
    () => (collectionSlug ? null : []),
  );

  useEffect(() => {
    if (!collectionSlug) return;

    const abort = new AbortController();

    fetchRows<RawProduct>(
      "products",
      { collection: [collectionSlug], limit: STRIP_SIZE },
      abort.signal,
    )
      .then((rows) => { if (!abort.signal.aborted) setProducts(rows.map(toStripProduct)); })
      .catch(() => { if (!abort.signal.aborted) setProducts([]); });

    return () => abort.abort();
  }, [collectionSlug]);

  return products;
}

function useCollection(slug: string) {
  const [collections, setCollections] = useState<RawCollection[] | null>(null);
  const products = useStripProducts(slug);

  useEffect(() => {
    let alive = true;
    loadCollections().then((rows) => { if (alive) setCollections(rows); });
    return () => { alive = false; };
  }, []);

  const loading = collections === null || products === null;

  // Part of the home page proper, so it holds the page loader up.
  useLoadingGate(loading);

  return {
    loading,
    products:   products ?? [],
    collection: collections?.find((c) => c.Slug === slug) ?? null,
  };
}

export interface CollectionStripProps {
  /** The entry in the dashboard `collections` list that drives this strip. */
  slug: string;
  /** Heading to use until the dashboard has a collection under that slug. */
  fallbackTitle: string;
  /** A collection carries only a name, so its supporting copy lives here. */
  tagline: string;
  cta: string;
  /**
   * Background token. Two strips running back to back need different ones or
   * they read as a single band with a heading dropped into the middle.
   */
  background?: string;
}

/**
 * A row of products merchandised under one collection.
 *
 * Offers and Bundles are the same thing with different copy — a collection the
 * client tags products into — so they are one component rather than two files
 * that have to be kept in step.
 */
export function CollectionStrip({
  slug,
  fallbackTitle,
  tagline,
  cta,
  background = "bg-dusty",
}: CollectionStripProps) {
  const { products, collection, loading } = useCollection(slug);

  // Land on the shop with this collection already ticked in the filters.
  const shopAllHref = `/shop-all?collection=${slug}`;

  // Nothing tagged into the collection — the section drops out entirely rather
  // than standing there empty.
  if (loading || products.length === 0) return null;

  return (
    <section className={`w-full flex flex-col justify-start items-center gap-[10px] p-0 overflow-clip rounded-none ${background}`}>

      <div className="w-full max-w-[1920px] flex flex-col justify-start items-start rounded-none
        gap-[24px] py-[48px] px-[16px]
        tablet:gap-[32px] tablet:py-[64px] tablet:px-[24px]
        desktop:gap-[32px] desktop:py-[80px] desktop:px-[32px]">

        {/* Title + CTA */}
        <div className="w-full flex flex-row justify-between items-end gap-[16px] p-0 rounded-none">

          <div className="flex flex-col justify-start items-start gap-[4px] min-w-0">
            <H4 className="w-full !text-brown !text-left [text-wrap:balance]">
              {collection?.Title || fallbackTitle}
            </H4>
            <ItalicBodySm className="w-full !text-brown !text-left [text-wrap:balance]">
              {tagline}
            </ItalicBodySm>
          </div>

          <Link href={shopAllHref} className="shrink-0">
            <OutlineButton>{cta}</OutlineButton>
          </Link>

        </div>

        <div className="w-full grid
            grid-cols-1 gap-x-[16px] gap-y-[48px]
            tablet:grid-cols-2 tablet:gap-x-[24px] tablet:gap-y-[40px]
            desktop:grid-cols-4 desktop:gap-x-[32px] desktop:gap-y-[48px]">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              title={p.title}
              price={p.price}
              discount={p.discount}
              imageSrc={p.imageSrc}
              stock={p.stock}
              href={`/products/${p.slug}`}
              className="!w-full"
            />
          ))}
        </div>

      </div>
    </section>
  );
}

export function OffersSection() {
  return (
    <CollectionStrip
      slug="offers"
      fallbackTitle="Offers"
      tagline="reduced while stocks last"
      cta="See all offers"
      background="bg-dusty"
    />
  );
}

export function BundlesSection() {
  return (
    <CollectionStrip
      slug="bundles"
      fallbackTitle="Bundles"
      tagline="save when you buy the set"
      cta="See all bundles"
      // Same ground as Offers, which is only safe because the two sit at
      // opposite ends of the page. What it must not match is Featured, which
      // follows it immediately on `bg-caledon`.
      background="bg-dusty"
    />
  );
}

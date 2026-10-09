import Link from "next/link";
import { H4, ItalicBodySm } from "./typography";
import { OutlineButton } from "./button";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/product";

/** How many products a strip shows before "see all". */
export const STRIP_SIZE = 8;

export interface CollectionStripProps {
  /** The entry in the dashboard `collections` list that drives this strip. */
  slug: string;
  /** The collection's name on the dashboard, when it has one. */
  title?: string;
  /** Heading to use until the dashboard has a collection under that slug. */
  fallbackTitle: string;
  /** Fetched on the server, so the strip is in the page's first HTML. */
  products: Product[];
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
  title,
  fallbackTitle,
  products,
  tagline,
  cta,
  background = "bg-dusty",
}: CollectionStripProps) {
  // Land on the shop with this collection already ticked in the filters.
  const shopAllHref = `/shop-all?collection=${slug}`;

  // Nothing tagged into the collection — the section drops out entirely rather
  // than standing there empty.
  if (products.length === 0) return null;

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
              {title || fallbackTitle}
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
              imageSrc={p.cover_img_1}
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

type StripData = Pick<CollectionStripProps, "title" | "products">;

export function OffersSection(data: StripData) {
  return (
    <CollectionStrip
      {...data}
      slug="offers"
      fallbackTitle="Offers"
      tagline="reduced while stocks last"
      cta="See all offers"
      background="bg-dusty"
    />
  );
}

export function BundlesSection(data: StripData) {
  return (
    <CollectionStrip
      {...data}
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

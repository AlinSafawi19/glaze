"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { H2, H4, ItalicBodyLg } from "@/components/ui/typography";
import { ProductCard } from "@/components/ui/product-card";
import { OutlineButton } from "@/components/ui/button";
import { useWishlist } from "@/components/ui/use-wishlist";
import { useLoadingGate } from "@/components/ui/loading-gate";
import { SectionLoading } from "@/components/ui/section-loading";
import { fetchAll, endpoint } from "@/lib/api";

const PRODUCTS_URL = endpoint("products");

interface RawEntry {
  id:            string;
  Slug:          string;
  Title:         string;
  "Cover img 1": string;
  Price:         string;
  Discount:      string;
}

interface Product {
  id:       string;
  slug:     string;
  title:    string;
  price:    number;
  discount: number;
  imageSrc: string;
}

export default function Wishlist() {
  const { slugs, ready, clear } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const abort = new AbortController();

    // Saved slugs are resolved against this, so it has to be the whole
    // catalogue and not whichever page the endpoint returns by default.
    fetchAll<RawEntry>(PRODUCTS_URL, { signal: abort.signal })
      .then((entries) => {
        if (abort.signal.aborted) return;
        setProducts(
          entries.map((e) => ({
            id:       e.id,
            slug:     e.Slug,
            title:    e.Title,
            price:    parseFloat(e.Price)    || 0,
            discount: parseFloat(e.Discount) || 0,
            imageSrc: e["Cover img 1"],
          }))
        );
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Keep the order the shopper saved them in.
  const saved = slugs
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is Product => Boolean(p));

  const settled = ready && !loading;

  // The page loader covers the wait — both the catalogue and reading the saved
  // slugs back out of storage.
  useLoadingGate(!settled);

  return (
    <main>
      <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 overflow-clip rounded-none bg-caledon">

        <div className="w-full max-w-[1920px] flex flex-col justify-start items-start rounded-none
          gap-[32px] py-[48px] px-[16px]
          tablet:gap-[40px] tablet:py-[64px] tablet:px-[24px]
          desktop:gap-[48px] desktop:py-[80px] desktop:px-[32px]">

          {/* Title — the empty state carries its own heading, so this only shows with saves */}
          {!settled && <SectionLoading />}

          {settled && saved.length > 0 && (
            <div className="w-full flex flex-col justify-start items-start gap-[4px] p-0 rounded-none">
              <H2 className="w-full !text-black !text-left">WISHLIST</H2>
              <ItalicBodyLg className="w-full !text-brown !text-left [text-wrap:balance]">
                {saved.length} {saved.length === 1 ? "product" : "products"} saved for later
              </ItalicBodyLg>
            </div>
          )}

          {settled && saved.length === 0 && (
            <div className="w-full flex flex-col justify-center items-center gap-[24px] py-[16px]">
              <H4 className="!text-brown !text-center [text-wrap:balance]">
                Nothing saved yet
              </H4>
              <ItalicBodyLg className="!text-brown !text-center max-w-[480px] [text-wrap:balance]">
                Tap the heart on any product to keep it here while you decide.
              </ItalicBodyLg>
              <Link href="/shop-all">
                <OutlineButton>Shop all</OutlineButton>
              </Link>
            </div>
          )}

          {settled && saved.length > 0 && (
            <>
              <div className="w-full flex flex-row flex-wrap justify-start items-start gap-[24px] tablet:gap-[32px]">
                {saved.map((p) => (
                  <ProductCard
                    key={p.id}
                    slug={p.slug}
                    title={p.title}
                    price={p.price}
                    discount={p.discount}
                    imageSrc={p.imageSrc}
                    href={`/products/${p.slug}`}
                    className="!w-full tablet:!w-[320px]"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={clear}
                className="self-center font-clash font-medium clash-features uppercase text-brown text-[14px] leading-[1.4] border border-dashed border-beige px-[32px] py-[12px] rounded-none bg-transparent cursor-pointer"
              >
                Clear wishlist
              </button>
            </>
          )}

        </div>
      </section>
    </main>
  );
}

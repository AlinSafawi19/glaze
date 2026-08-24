"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { LiquidLogo } from "@/components/ui/liquid-logo";
import { Logomark } from "@/components/ui/logomark";
import { H3, H4, SubtitleMd, ItalicBodySm } from "@/components/ui/typography";
import { TickerBar } from "@/components/ui/ticker-bar";
import Link from "next/link";
import { OutlineButton } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { BundlesSection, OffersSection } from "@/components/ui/collection-strip";
import { useLoadingGate } from "@/components/ui/loading-gate";
import { fetchPage, endpoint } from "@/lib/api";
import { parseStock } from "@/lib/stock";

const EASE = [0.44, 0, 0.56, 1] as const;

const PRODUCTS_URL = endpoint("products");

interface FeaturedProduct {
  id:       string;
  slug:     string;
  title:    string;
  price:    number;
  discount: number;
  imageSrc: string;
  stock:    number | null;
}

interface RawFeaturedEntry {
  id:            string;
  Slug:          string;
  Title:         string;
  "Cover img 1": string;
  Price:         string;
  Discount:      string;
  Stock?:        string;
}

function useFeaturedProducts(limit: number) {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const abort = new AbortController();

    // A short strip on the home page — ask for exactly the rows it shows
    // rather than pulling a page of the catalogue and throwing most away.
    fetchPage<RawFeaturedEntry>(PRODUCTS_URL, { limit, signal: abort.signal })
      .then(({ rows }) => {
        if (abort.signal.aborted) return;
        setProducts(
          rows.slice(0, limit).map((e) => ({
            id:       e.id,
            slug:     e.Slug,
            title:    e.Title,
            price:    parseFloat(e.Price)        || 0,
            discount: parseFloat(e.Discount)     || 0,
            imageSrc: e["Cover img 1"],
            stock:    parseStock(e.Stock),
          }))
        );
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [limit]);

  // Hold the page loader up rather than showing a spinner in the grid.
  useLoadingGate(loading);

  return { products, loading };
}

const categories = [
  {
    name: "SKINCARE",
    description: "gentle, layered, essential",
    mainImage: "https://framerusercontent.com/images/VUFOdY8DyW3XNyJHXlrjZz3t8w.png?scale-down-to=2048&width=2400&height=1800",
    previewImage: "https://framerusercontent.com/images/dM2O8O1L9vG9OPpdktWUlo5BEH8.png",
    bgColor: "bg-blush",
    reversed: false,
    zIndex: 1,
    href: "/shop-all",
  },
];

export default function Home() {
  const { products: featuredProducts, loading: featuredLoading } = useFeaturedProducts(3);

  return (
    <main>

      {/* â”€â”€ Hero â”€â”€ */}
      <section className="relative w-full h-[calc(100vh-60px)] tablet:h-[calc(100vh-68px)] desktop:h-[calc(100vh-72px)] flex flex-col justify-start items-center gap-[10px] p-0 overflow-clip">

        {/* LiquidLogo â€” absolute, fills hero, z-1 */}
        <div className="absolute inset-0 z-[1]">
          <LiquidLogo
            image="https://framerusercontent.com/images/ZbYyoU6EfYLcinn2akWs02lFfg.png?scale-down-to=2048&width=2400&height=1800"
            distortionStrength={0.06}
            hoverRadius={0.07}
            decayTime={1400}
          />
        </div>

        {/* Container â€” z-2, pointer-none, relative for absolute children */}
        <div
          className="relative z-[2] w-full flex-1 max-w-[1920px] flex flex-col justify-end items-center gap-[64px] overflow-clip pointer-events-none rounded-none"
          style={{ padding: "80px 32px 32px 32px" }}
        >
          <H3 className="absolute top-[120px] right-[32px] !text-accent !text-right z-[1] w-auto">
            From Seoul
          </H3>

          {/* Subtitles */}
          <div className="w-full flex flex-row justify-between items-center overflow-clip rounded-none border-b border-dashed border-white" style={{ padding: "16px 0" }}>
            <SubtitleMd className="w-auto grow !text-white !text-left">K-Beauty</SubtitleMd>
            <SubtitleMd className="w-auto grow !text-white !text-center">Rituals</SubtitleMd>
            <SubtitleMd className="w-auto grow !text-white !text-right">Radiance</SubtitleMd>
          </div>

          {/* Hero title */}
          <Logomark />

        </div>

      </section>

      {/* â”€â”€ Ticker â”€â”€ */}
      <TickerBar />


      <OffersSection />

      {/* â”€â”€ Categories â”€â”€ */}
      <section className="w-full flex flex-col justify-start items-center gap-0 p-0 overflow-clip rounded-none">

        {categories.map(({ name, description, mainImage, previewImage, bgColor, reversed, zIndex, href }) => (
          <div
            key={name}
            className={`tablet:sticky top-0 w-full max-w-[1920px] flex flex-col-reverse p-0 overflow-clip rounded-none tablet:items-stretch ${reversed ? "tablet:flex-row-reverse" : "tablet:flex-row"}`}
            style={{ zIndex }}
          >

            {/* Imgs Wrapper */}
            <div className="w-full h-[400px] tablet:w-1/2 tablet:h-[692px] relative overflow-hidden">
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.2 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: false }}
                transition={{ ease: EASE, duration: 0.6 }}
              >
                <Image
                  src={mainImage}
                  alt={name}
                  fill
                  sizes="(max-width: 809px) 100vw, 50vw"
                  quality={100}
                  unoptimized
                  className="object-cover object-top"
                />
              </motion.div>
            </div>

            {/* Title Wrapper */}
            <div className={`w-full tablet:w-1/2 ${bgColor} flex flex-col justify-start items-center py-[48px] px-[16px] gap-[80px] tablet:py-[80px] tablet:px-[24px] desktop:gap-[184px] desktop:py-[120px] desktop:px-[32px]`}>

              {/* Text block */}
              <div className="w-full flex flex-col gap-[8px] items-center">
                <H4 className="!text-black !text-center">{name}</H4>
                <ItalicBodySm className="!text-black !text-center" style={{ opacity: 0.6 }}>{description}</ItalicBodySm>
              </div>

              {/* Explore sub-wrapper */}
              <div className="flex flex-col items-center gap-[16px]">
                <div className="relative w-[200px] h-[120px] flex-shrink-0 overflow-hidden">
                  <Image
                    src={previewImage}
                    alt=""
                    fill
                    sizes="200px"
                    quality={100}
                  unoptimized
                    className="object-cover object-top"
                  />
                </div>
                <Link href={href} tabIndex={-1}>
                  <OutlineButton>Explore</OutlineButton>
                </Link>
              </div>

            </div>

          </div>
        ))}

      </section>

      {/* ── Bundles ── */}
      {/* Deliberately not next to Offers: the two are the same strip with
          different copy, and stacked they read as one long band with a heading
          dropped into the middle. The Categories band between them is what
          makes each land as its own thing. */}
      <BundlesSection />

      {/* â”€â”€ Featured â”€â”€ */}
      {/* Hidden outright when there is nothing featured. */}
      {!featuredLoading && featuredProducts.length > 0 && (
        <section className="w-full flex flex-col justify-start items-center gap-[10px] p-0 overflow-visible rounded-none bg-caledon
          py-[32px]
          tablet:py-[40px]
          desktop:py-[56px]">

          {/* Container */}
          <div className="w-full max-w-[1920px] flex flex-col justify-start items-start overflow-visible rounded-none z-[2]
            gap-[40px] px-[16px]
            tablet:gap-[32px] tablet:px-[24px]
            desktop:gap-[32px] desktop:px-[32px]">

            {/* Title Wrapper */}
            <div className="sticky top-0 w-full max-w-[400px] flex flex-col justify-start items-start gap-[8px] overflow-visible rounded-none p-0 z-[1]">
              <H4 className="w-full !text-brown !text-left [text-wrap:balance]">Featured Products</H4>
            </div>

            {/* Products Wrapper */}
            <div
              className="w-full grid grid-cols-1 tablet:grid-cols-3 overflow-visible rounded-none p-0"
              style={{ columnGap: "16px", rowGap: "48px" }}
            >
              {featuredProducts.map((product) => (
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

          </div>

        </section>
      )}


    </main>
  );
}

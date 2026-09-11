"use client";

import { useState, useEffect, type ReactNode } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Truck, LockKeyhole, Wallet, PhoneCall, ShoppingBag } from "lucide-react";
import { H1, H4, H5, BodySm, ItalicBodySm, SubtitleSm } from "@/components/ui/typography";
import Link from "next/link";
import { OutlineButton, FilledButton } from "@/components/ui/button";
import { FaqCardProduct } from "@/components/ui/faq-card";
import { ProductCard } from "@/components/ui/product-card";
import { WishlistDetailButton } from "@/components/ui/wishlist-button";
import { useCart } from "@/components/ui/use-cart";
import { useLoadingGate } from "@/components/ui/loading-gate";
import { SectionLoading } from "@/components/ui/section-loading";
import { ProductImage } from "@/components/ui/product-image";
import { categorySlugs, relationSlug, type Relation, type RawRelations } from "@/lib/relations";
import { fetchBySlug, fetchRows } from "@/lib/api";
import { isSoldOut, lowStockNote, parseStock } from "@/lib/stock";

/** How many other products the page shows under "you may also like". */
const RELATED_COUNT = 4;

function toProduct(e: RawEntry): Product {
  return {
    id:              e.id,
    slug:            e.Slug                ?? "",
    title:           e.Title               ?? "",
    price:           parseFloat(e.Price)        || 0,
    discount:        parseFloat(e.Discount)     || 0,
    cover_img_1:     e["Cover img 1"]      ?? "",
    img_2:           e["Img 2"]             ?? "",
    img_3:           e["Img 3"]             ?? "",
    img_4:           e["Img 4"]             ?? "",
    categories:      categorySlugs(e),
    brand:           relationSlug(e.Brand),
    size:            e.Size                 ?? "",
    sku:             parseInt(e.SKU)        || 0,
    stock:           parseStock(e.Stock),
    description:     e.Description          ?? "",
    best_for:        e["Best For"]          ?? "",
    benefits:        e.Benefits             ?? "",
    how_to_use:      e["How to Use"]        ?? "",
    key_ingredients: e["Key Ingredients"]   ?? "",
    sales_type:      e["Sales type"]        ?? "",
    collections:     relationSlug(e.Collections),
  };
}

interface Product {
  id:              string;
  slug:            string;
  title:           string;
  price:           number;
  discount:        number;
  cover_img_1:     string;
  img_2:           string;
  img_3:           string;
  img_4:           string;
  /** A product can be filed under several headings at once. */
  categories:      string[];
  brand:           string;
  size:            string;
  sku:             number;
  stock:           number | null;
  description:     string;
  best_for:        string;
  benefits:        string;
  how_to_use:      string;
  key_ingredients: string;
  sales_type:      string;
  collections:     string;
}

interface RawEntry extends RawRelations {
  id:              string;
  Slug:            string;
  Title:           string;
  Price:           string;
  Discount:        string;
  "Cover img 1":   string;
  "Img 2":         string;
  "Img 3":         string;
  "Img 4":         string;
  Brand:           Relation;
  Size:            string;
  SKU:             string;
  Stock?:          string;
  Description:     string;
  "Best For":      string;
  Benefits:        string;
  "How to Use":    string;
  "Key Ingredients": string;
  "Sales type":    string;
  Collections:     Relation;
}

const FEATURES: { title: string; description: string; icon: ReactNode }[] = [
  {
    title:       "Delivery Nationwide",
    description: "Shipped from our warehouse; the delivery fee is quoted before you confirm.",
    icon:        <Truck size={24} strokeWidth={1.5} />,
  },
  {
    title:       "Cash On Delivery",
    description: "Pay the courier in cash. We never ask for card details, online or by phone.",
    icon:        <LockKeyhole size={24} strokeWidth={1.5} />,
  },
  {
    title:       "Sealed & Authentic",
    description: "Every item arrives sealed, sourced from the Korean brand or its distributor.",
    icon:        <Wallet size={24} strokeWidth={1.5} />,
  },
  {
    title:       "24/7 Customer Support",
    description: "Our support team is always available to assist you anytime, anywhere.",
    icon:        <PhoneCall size={24} strokeWidth={1.5} />,
  },
];

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <div className="flex flex-col justify-start items-start gap-[16px] p-0 overflow-clip rounded-none">
      <span className="text-black">{icon}</span>
      <div className="flex flex-col justify-start items-start gap-[8px]">
        <H5 className="!text-black !text-left">{title}</H5>
        <ItalicBodySm className="!text-black !text-left">{description}</ItalicBodySm>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();

  const [product,      setProduct]      = useState<Product | null>(null);
  const [related,      setRelated]      = useState<Product[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeImage,  setActiveImage]  = useState(0);
  const [added,        setAdded]        = useState(false);
  const { add } = useCart();

  // Marked as loading in the render that changed the slug, so the previous
  // product is never left on screen while the next one is being fetched.
  const [sent, setSent] = useState(slug);
  if (sent !== slug) {
    setSent(slug);
    setLoading(true);
    // The gallery belongs to the product that is leaving; the next one opens on
    // its own cover.
    setActiveImage(0);
  }

  useEffect(() => {
    const abort = new AbortController();

    // Two narrow queries rather than a catalogue: this product by slug, and a
    // handful of others for the strip underneath. Both cost the same whether
    // the shop stocks fifty products or fifty thousand.
    Promise.all([
      fetchBySlug<RawEntry>("products", slug, abort.signal),
      fetchRows<RawEntry>(
        "products",
        { exclude: [slug], limit: RELATED_COUNT },
        abort.signal,
      ),
    ])
      .then(([found, others]) => {
        if (abort.signal.aborted) return;
        setProduct(found ? toProduct(found) : null);
        setRelated(others.map(toProduct));
      })
      .catch(() => {
        if (abort.signal.aborted) return;
        setProduct(null);
        setRelated([]);
      })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });

    return () => abort.abort();
  }, [slug]);

  // On the first open the page loader covers this; on a navigation into the
  // product the section holds the height while the catalogue lands.
  useLoadingGate(loading);
  if (loading) return <main><SectionLoading className="min-h-screen bg-caledon" /></main>;

  const images = product
    ? [product.cover_img_1, product.img_2, product.img_3, product.img_4].filter(Boolean)
    : [];

  if (!product) {
    return (
      <main className="flex items-center justify-center w-full h-screen">
        <H4 className="!text-brown">Product not found</H4>
      </main>
    );
  }

  const finalPrice      = product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(0)
    : null;
  const soldOut         = isSoldOut(product.stock);
  const lowNote         = lowStockNote(product.stock);
  const brandLabel      = product.brand.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const categoryLabel   = product.categories
    .map((c) => c.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()))
    .join(", ");

  return (
    <main>

      {/* ── Cart container ── */}
      <div className="w-full flex flex-col justify-start items-center gap-0 p-0 overflow-clip rounded-none">

        {/* ── Container 1: Product detail ── */}
        <div className="w-full max-w-[1920px] flex flex-col desktop:flex-row justify-start items-start gap-0 p-0 overflow-clip rounded-none bg-caledon">

          {/* Images wrapper */}
          <div className="w-full desktop:w-[55%] flex flex-col justify-start items-start gap-[1px] p-0 overflow-clip rounded-none bg-caledon">

            {/* img 1 — full height banner */}
            <div className="relative w-full h-[400px] tablet:h-[50vh] desktop:h-screen overflow-visible rounded-none">
              <ProductImage
                src={product.cover_img_1}
                alt={product.title}
                sizes="(max-width: 1199px) 100vw, 55vw"
              />
            </div>

            {/* img 2 + img 3 — mid banner */}
            {(product.img_2 || product.img_3) && (
              <div className="w-full h-[640px] tablet:h-[50vh] flex flex-col tablet:flex-row justify-start items-center gap-[1px] overflow-clip rounded-none">
                {product.img_2 && (
                  <div className="relative flex-1 w-full h-full overflow-visible rounded-none">
                    <Image
                      src={product.img_2}
                      alt=""
                      fill
                      sizes="(max-width: 809px) 100vw, (max-width: 1199px) 50vw, 27vw"
                      quality={100}
                      unoptimized
                      className="object-cover object-center"
                    />
                  </div>
                )}
                {product.img_3 && (
                  <div className="relative flex-1 w-full h-full overflow-visible rounded-none">
                    <Image
                      src={product.img_3}
                      alt=""
                      fill
                      sizes="(max-width: 809px) 100vw, (max-width: 1199px) 50vw, 27vw"
                      quality={100}
                      unoptimized
                      className="object-cover object-center"
                    />
                  </div>
                )}
              </div>
            )}

            {/* img 4 — full height banner */}
            {product.img_4 && (
              <div className="relative w-full h-[400px] tablet:h-[50vh] desktop:h-screen overflow-visible rounded-none">
                <Image
                  src={product.img_4}
                  alt=""
                  fill
                  sizes="(max-width: 1199px) 100vw, 55vw"
                  quality={100}
                  unoptimized
                  className="object-cover object-center"
                />
              </div>
            )}

          </div>

          {/* Details wrapper */}
          <div className="w-full flex-1 desktop:sticky desktop:top-0 desktop:self-start flex flex-col justify-start items-start gap-[48px] overflow-visible rounded-none bg-caledon z-[1]
            pt-[32px] px-[16px] pb-[32px]
            tablet:pt-[48px] tablet:px-[24px] tablet:pb-[40px]
            desktop:pt-[80px] desktop:px-[32px] desktop:pb-[48px]">

            {/* Top wrapper */}
            <div className="w-[476px] max-w-full flex flex-col justify-start items-start gap-[24px] p-0 overflow-visible rounded-none">

              {/* Title box */}
              <div className="w-full flex flex-col justify-start items-start gap-[16px] p-0 overflow-clip rounded-none">

                {/* Sales type */}
                {product.sales_type && (
                  <div className="flex flex-row justify-end items-center gap-[8px] py-[8px] px-[16px] bg-blush overflow-clip rounded-none">
                    <SubtitleSm className="!text-black !text-left w-auto">{product.sales_type}</SubtitleSm>
                  </div>
                )}

                {/* Title */}
                <H1 className="w-full max-w-[480px] h-auto !text-black !text-left">{product.title}</H1>

                {/* Price × discount wrapper */}
                <div className="w-full flex flex-row justify-start items-center gap-[12px] p-0 overflow-clip rounded-none">

                  {/* Price */}
                  <div className="flex flex-row justify-start items-center gap-[8px]">
                    <H4 className="!text-brown !text-left w-auto">$</H4>
                    <H4 className="!text-brown !text-left w-auto">{finalPrice ?? product.price}</H4>
                  </div>

                  {/* Discount */}
                  {product.discount !== 0 && (
                    <div className="flex flex-row items-center gap-[6px] py-[4px] px-[12px] bg-berry overflow-clip rounded-none">
                      <H4 className="!text-brown !text-left w-auto">%</H4>
                      <H4 className="!text-brown !text-left w-auto">{product.discount}</H4>
                    </div>
                  )}

                </div>

              </div>

              {/* SKU box */}
              <div className="w-full flex flex-row justify-start items-start gap-[8px] p-0 overflow-clip rounded-none">
                <BodySm className="w-auto max-w-[600px] !text-brown !text-left">SKU:</BodySm>
                <BodySm className="w-auto h-auto max-w-[600px] !text-brown !text-left">{product.sku}</BodySm>
              </div>

            </div>

            {/* Divider */}
            <div className="w-full h-[1px] overflow-clip rounded-none bg-beige" />

            {/* Key Ingredients × Size */}
            <div className="w-full flex flex-row justify-start items-start gap-[24px] p-0 overflow-clip rounded-none">

              <div className="flex flex-col justify-start items-start gap-[8px] p-0 overflow-clip rounded-none">
                <SubtitleSm className="w-full max-w-[600px] h-auto !text-black !text-left">Key Ingredients</SubtitleSm>
                <BodySm className="w-full max-w-[600px] h-auto !text-black !text-left">{product.key_ingredients}</BodySm>
              </div>

              <div className="flex flex-col justify-start items-start gap-[8px] p-0 overflow-clip rounded-none">
                <SubtitleSm className="w-full max-w-[600px] h-auto !text-black !text-left">Size</SubtitleSm>
                <BodySm className="w-full max-w-[600px] h-auto !text-black !text-left">{product.size}</BodySm>
              </div>

            </div>

            {/* Description */}
            <div className="w-full flex flex-col justify-start items-start gap-[8px] p-0 overflow-clip rounded-none">
              <SubtitleSm className="w-full max-w-[600px] h-auto !text-black !text-left">Description</SubtitleSm>
              <BodySm className="w-full max-w-[480px] tablet:max-w-[600px] h-auto !text-black !text-left">{product.description}</BodySm>
            </div>

            {/* Stock — said before the button rather than only on it, so the
                shopper reads why it is disabled rather than that it is. */}
            {(soldOut || lowNote) && (
              <div className="w-full flex flex-row flex-wrap justify-start items-baseline gap-[8px] p-0 rounded-none">
                <SubtitleSm className="w-auto !text-plum !text-left">
                  {soldOut ? "Out of stock" : lowNote}
                </SubtitleSm>
                {soldOut && (
                  <BodySm className="w-auto !text-brown !text-left">
                    Save it to your wishlist and it is waiting when it is back.
                  </BodySm>
                )}
              </div>
            )}

            {/* Add to cart × wishlist */}
            <div className="w-full flex flex-row justify-start items-stretch gap-[8px]">
              <FilledButton
                className="flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={soldOut}
                icon={<ShoppingBag size={16} strokeWidth={1.5} />}
                onClick={() => {
                  if (soldOut) return;
                  add(product.slug);
                  setAdded(true);
                }}
              >
                {soldOut ? "Out of stock" : added ? "Added to cart" : "Add to cart"}
              </FilledButton>
              <WishlistDetailButton slug={product.slug} title={product.title} />
            </div>

            {/* Bottom wrapper — the shop's own copy about this product rather
                than the same three blurbs on every page. A field it has not
                filled in drops out entirely, and the wrapper goes with the last
                of them so its rules never frame an empty stack.

                Rules are element borders rather than 1px boxes so every
                boundary snaps to the device pixel grid the same way. */}
            {(product.benefits || product.best_for || product.how_to_use) && (
              <div className="w-full flex flex-col justify-start items-stretch gap-0 p-0 rounded-none border-y border-solid border-beige divide-y divide-beige">
                {product.benefits && (
                  <FaqCardProduct
                    question="Benefits"
                    answer={product.benefits}
                    className="w-full py-[8px]"
                  />
                )}
                {product.best_for && (
                  <FaqCardProduct
                    question="Best For"
                    answer={product.best_for}
                    className="w-full py-[8px]"
                  />
                )}
                {product.how_to_use && (
                  <FaqCardProduct
                    question="How To Use"
                    answer={product.how_to_use}
                    className="w-full py-[8px]"
                  />
                )}
              </div>
            )}

          </div>

        </div>

        {/* ── Container 2: Benefits ── */}
        <div
          className="w-full max-w-[1920px] flex flex-col justify-start items-start gap-[32px] overflow-clip rounded-none bg-white
            pt-[48px] px-[16px] pb-[48px]
            tablet:pt-[48px] tablet:px-[24px] tablet:pb-[48px]
            desktop:pt-[64px] desktop:px-[32px] desktop:pb-[80px]"
          style={{
            borderTop:    "1px dashed var(--color-beige)",
            borderBottom: "1px dashed var(--color-beige)",
          }}
        >

          {/* Title wrapper */}
          <div className="w-full flex flex-col justify-start items-start gap-[16px] p-0 overflow-clip rounded-none">
            <H4 className="w-full !text-black !text-left">Your Benefits, <br/>Our Promise</H4>
          </div>

          {/* Features wrapper */}
          <div className="w-full grid overflow-clip rounded-none
            grid-cols-1 gap-x-0 gap-y-[32px]
            tablet:grid-cols-2 tablet:gap-x-[32px] tablet:gap-y-[32px]
            desktop:grid-cols-4 desktop:gap-x-[32px] desktop:gap-y-[32px]">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} title={f.title} description={f.description} icon={f.icon} />
            ))}
          </div>

        </div>

        {/* ── Container 3: Related products ── */}
        {/* Hidden when the strip is empty: it is other products rather than a
            curated list, so nothing to show means this is the only thing in
            the shop — and a heading over a blank row reads as a failed load. */}
        {related.length > 0 && (
          <div className="w-full max-w-[1920px] flex flex-col justify-start items-start gap-[24px] overflow-clip rounded-none bg-white
            pt-[48px] px-[16px] pb-[48px]
            tablet:pt-[48px] tablet:px-[24px] tablet:pb-[48px]
            desktop:pt-[64px] desktop:px-[32px] desktop:pb-[80px]">

            {/* Title */}
            <div className="w-full flex flex-row justify-between items-center gap-[16px] overflow-visible rounded-none p-0">
              <H4 className="!text-black !text-left [text-wrap:balance]">Related <br/>Products</H4>
              <Link href="/shop-all" tabIndex={-1}>
                <OutlineButton icon={null}>Explore all</OutlineButton>
              </Link>
            </div>

            {/* Products grid */}
            <div
              className="w-full grid overflow-visible rounded-none p-0
                grid-cols-1
                tablet:grid-cols-2"
              style={{ columnGap: "16px", rowGap: "48px" }}
            >
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  title={p.title}
                  price={p.price}
                  discount={p.discount}
                  imageSrc={p.cover_img_1}
                  slug={p.slug}
                  stock={p.stock}
                  href={`/products/${p.slug}`}
                  className="!w-full"
                />
              ))}
            </div>

          </div>
        )}

      </div>

    </main>
  );
}

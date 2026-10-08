"use client";

import { useState, type ReactNode } from "react";
import { Truck, LockKeyhole, Wallet, PhoneCall, ShoppingBag } from "lucide-react";
import { H1, H4, H5, BodySm, ItalicBodySm, SubtitleSm } from "@/components/ui/typography";
import Link from "next/link";
import { OutlineButton, FilledButton } from "@/components/ui/button";
import { FaqCardProduct } from "@/components/ui/faq-card";
import { ProductCard } from "@/components/ui/product-card";
import { WishlistDetailButton } from "@/components/ui/wishlist-button";
import { useCart } from "@/components/ui/use-cart";
import { ProductGallery } from "@/components/ui/product-gallery";
import { productImages, salePrice, type Product } from "@/lib/product";
import { isSoldOut, lowStockNote } from "@/lib/stock";

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

/**
 * The product page's interactive half. The data arrives from the server
 * component in `page.tsx`, so the product is in the HTML a crawler receives
 * rather than fetched after hydration.
 */
export function ProductView({ product, related }: { product: Product; related: Product[] }) {
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  const images        = productImages(product);
  const price         = salePrice(product);
  const soldOut       = isSoldOut(product.stock);
  const lowNote       = lowStockNote(product.stock);

  return (
    <main>

      {/* ── Cart container ── */}
      <div className="w-full flex flex-col justify-start items-center gap-0 p-0 overflow-clip rounded-none">

        {/* ── Container 1: Product detail ── */}
        <div className="w-full max-w-[1920px] flex flex-col desktop:flex-row justify-start items-start gap-0 p-0 overflow-clip rounded-none bg-caledon">

          {/* Images wrapper */}
          <div className="w-full desktop:w-[55%] flex flex-col justify-start items-start gap-0 p-0 overflow-clip rounded-none bg-caledon">
            <ProductGallery key={product.slug} images={images} title={product.title} />
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
                    <H4 className="!text-brown !text-left w-auto">{price}</H4>
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

            {/* The shop's own copy about this product, in the slot the three
                fixed blurbs used to fill at the foot of every page. It reads
                under the description but stays folded: collapsed it is three
                rows rather than three blocks of prose, so it sits above the
                buttons without pushing them down the page.

                A field the shop has not filled in drops out entirely, and the
                wrapper goes with the last of them so its rules never frame an
                empty stack. Those rules are element borders rather than 1px
                boxes so every boundary snaps to the device pixel grid the same
                way. */}
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

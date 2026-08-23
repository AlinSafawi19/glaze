"use client";

import { useEffect, useState } from "react";
import { SubtitleMd, SubtitleSm } from "./typography";
import { ProductImage } from "./product-image";
import { DiscoverCursor } from "./discover-cursor";
import { WishlistButton } from "./wishlist-button";
import { useCart } from "./use-cart";
import { isSoldOut, lowStockNote } from "@/lib/stock";

interface ProductCardProps {
  slug?: string;
  title?: string;
  price?: number;
  discount?: number;
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
  className?: string;
  /** Units left, or null when the shop does not track this product. */
  stock?: number | null;
}

const EASE = "cubic-bezier(0.44, 0, 0.56, 1)";

export function ProductCard({
  slug      = "",
  title     = "Oak Cinnamon",
  price     = 260,
  discount  = 50,
  imageSrc  = "",
  imageAlt  = "",
  href      = "#",
  className = "",
  stock     = null,
}: ProductCardProps) {
  const soldOut = isSoldOut(stock);
  const lowNote = lowStockNote(stock);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [overCta,   setOverCta]   = useState(false);
  const { add } = useCart();

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1200);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onScroll = () => setHovered(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The Discover cursor is suppressed over the heart so its own pointer shows.
  // The Discover cursor steps aside over the card controls.
  const cursorVisible = isDesktop && hovered && !overCta;

  return (
    <a
      href={href}
      className={`w-[320px] flex flex-col justify-start items-start gap-[16px] p-0 overflow-visible rounded-none ${cursorVisible ? "cursor-none" : ""} ${className}`}
      style={{ transition: `all 0.4s ${EASE} 0s`, rotate: "0deg" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <DiscoverCursor visible={cursorVisible} />
      {/* Img Wrapper */}
      <div className="w-full h-[360px] max-h-[360px] flex flex-row justify-center items-center gap-[10px] p-0 overflow-clip rounded-none relative">

        {/* Image */}
        <div
          className="relative w-full h-full"
          style={{ transform: cursorVisible ? "scale(1.05)" : "scale(1)", transition: `transform 0.4s ${EASE}` }}
        >
          <ProductImage
            src={imageSrc}
            alt={imageAlt}
            sizes="320px"
            className={`object-cover ${soldOut ? "opacity-45 grayscale" : ""}`}
          />
        </div>

        {/* Sold out — top right, so it never lands on the discount badge. */}
        {soldOut && (
          <div
            className="absolute top-[16px] right-[16px] flex flex-row justify-start items-center overflow-visible rounded-none z-[1] bg-black"
            style={{ padding: "4px 12px" }}
          >
            <SubtitleSm className="!text-accent !text-left grow z-[1]">Out of stock</SubtitleSm>
          </div>
        )}

        {/* Discount Wrapper — hidden when discount === 0 */}
        {discount !== 0 && (
          <div
            className="absolute top-[16px] left-[16px] flex flex-row justify-start items-center gap-[2px] overflow-visible rounded-none z-[1] bg-white"
            style={{ padding: "4px 12px" }}
          >
            <SubtitleSm className="!text-black !text-left grow z-[1]">%</SubtitleSm>
            <SubtitleSm className="!text-black !text-left grow z-[1]">{discount}</SubtitleSm>
          </div>
        )}
      </div>

      {/* Details Wrapper */}
      <div className="w-full flex flex-col justify-start items-start gap-[6px] p-0 overflow-clip rounded-none">

        {/* Title */}
        <SubtitleMd className="w-full !text-black !text-left">{title}</SubtitleMd>

        {/* Price Wrapper */}
        <div className="w-full flex flex-row justify-start items-center gap-[4px] p-0 overflow-clip rounded-none">
          <SubtitleMd className="!text-black !text-left">$</SubtitleMd>
          <SubtitleMd className="!text-black !text-left">{price}</SubtitleMd>
        </div>

        {lowNote && (
          <SubtitleSm className="w-full !text-plum !text-left">{lowNote}</SubtitleSm>
        )}

        {/* Add to cart + wishlist */}
        {slug && (
          <div
            className="w-full flex flex-row justify-start items-stretch gap-[8px] pt-[4px]"
            onMouseEnter={() => setOverCta(true)}
            onMouseLeave={() => setOverCta(false)}
          >
            {/* Still a button rather than a hidden control: the shopper needs
                to see that the shop stocks this at all, and the wishlist beside
                it is how they ask to be reminded. */}
            <button
              type="button"
              disabled={soldOut}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!soldOut) add(slug);
              }}
              className={`flex-1 font-clash font-medium clash-features uppercase text-[13px] leading-[1.4] border border-dotted border-beige px-[16px] py-[10px] rounded-none bg-transparent transition-colors duration-300 ${
                soldOut
                  ? "text-beige cursor-not-allowed"
                  : "text-brown cursor-pointer hover:bg-blush hover:text-plum"
              }`}
            >
              {soldOut ? "Out of stock" : "Add to cart"}
            </button>

            <WishlistButton
              slug={slug}
              title={title}
              className="!w-[40px] !h-auto shrink-0 !rounded-none !bg-transparent !border !border-dotted !border-beige hover:!bg-blush"
            />
          </div>
        )}

      </div>
    </a>
  );
}

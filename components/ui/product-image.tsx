"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { SubtitleSm } from "./typography";

export interface ProductImageProps {
  /** Absent, empty or broken all land on the placeholder. */
  src?: string | null;
  alt?: string;
  sizes?: string;
  /** Classes for the picture itself — object fit, position, filters. */
  className?: string;
  /** Thumbnails have no room for the caption; the glyph carries it alone. */
  compact?: boolean;
}

/**
 * A product's artwork, or a placeholder standing in for it.
 *
 * The card used to fall back to a stock photograph of a different product
 * entirely, which is worse than showing nothing: a shopper cannot tell filler
 * from the real thing, so the shop ends up advertising something it does not
 * sell. A product with no picture now says it has no picture.
 *
 * A URL that fails at runtime lands here too. An image deleted from the
 * dashboard leaves a live-looking link behind, and the browser's broken-image
 * icon is not a state this shop should ever render.
 *
 * Expects a `relative` parent, like the `fill` image it replaces.
 */
export function ProductImage({
  src,
  alt = "",
  sizes,
  className = "object-cover object-center",
  compact = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const usable = typeof src === "string" && src.trim() !== "" && !failed;

  if (usable) {
    return (
      <Image
        src={src.trim()}
        alt={alt}
        fill
        sizes={sizes}
        quality={100}
        unoptimized
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  // A decorative picture stays decorative when it is missing. Cards and cart
  // lines pass no alt because the title is already read out beside them, and
  // announcing "no image yet" there would be one more thing to listen past.
  const decorative = alt === "";

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-[8px] bg-dusty"
      style={{ border: "1px dashed var(--color-beige)" }}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": `${alt} — no image yet` })}
    >
      <span className="text-beige">
        <ImageOff size={compact ? 16 : 28} strokeWidth={1.25} />
      </span>
      {!compact && (
        <SubtitleSm className="!text-beige !text-center">No image yet</SubtitleSm>
      )}
    </div>
  );
}

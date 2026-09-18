"use client";

import { useEffect, useState } from "react";

import { ProductImage } from "./product-image";

/** How long an image holds before the gallery moves on by itself. */
const SLIDE_MS = 5000;

export interface ProductGalleryProps {
  /** Cover first, then the extra shots — already filtered of empty slots. */
  images: string[];
  /** The product's name, read out for the picture that stands for it. */
  title: string;
}

/**
 * One large picture with the rest as thumbnails under it.
 *
 * Every image is mounted at once and cross-faded by opacity rather than swapped
 * into a single `src`. It costs one request per shot on open — four at most —
 * and buys a rotation with no flash of empty frame between them, which a swap
 * cannot give while the next file is still downloading.
 *
 * The rotation is a convenience, not the way through the set: it stops while a
 * shopper is looking at the strip, and it never runs for someone who has asked
 * their system to keep motion down.
 */
export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);

  // `active` is a dependency so a thumbnail picked by hand gets a full turn on
  // screen rather than whatever was left of the running one.
  useEffect(() => {
    if (images.length < 2 || held) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(
      () => setActive((current) => (current + 1) % images.length),
      SLIDE_MS,
    );
    return () => clearInterval(id);
  }, [images.length, held, active]);

  if (images.length === 0) {
    return (
      <div className="relative w-full h-[420px] tablet:h-[60vh] desktop:h-[calc(100vh-140px)] overflow-clip rounded-none">
        <ProductImage src={null} alt={title} sizes="(max-width: 1199px) 100vw, 55vw" />
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col justify-start items-start gap-[8px] p-0 overflow-clip rounded-none"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >

      {/* Stage */}
      <div className="relative w-full h-[420px] tablet:h-[60vh] desktop:h-[calc(100vh-140px)] overflow-clip rounded-none">
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={index !== active}
          >
            <ProductImage
              src={src}
              // The stage stands for the product once; the rest are more of the
              // same thing and would only repeat the name to a screen reader.
              alt={index === 0 ? title : ""}
              sizes="(max-width: 1199px) 100vw, 55vw"
            />
          </div>
        ))}
      </div>

      {/* Strip — a single shot has nothing to switch between. */}
      {images.length > 1 && (
        <div className="w-full flex flex-row justify-start items-start gap-[8px] overflow-x-auto rounded-none
          px-[16px] pb-[16px] tablet:px-[24px] tablet:pb-[24px] desktop:px-[32px] desktop:pb-[32px]">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}-thumb`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === active}
              className={`relative shrink-0 w-[88px] h-[88px] tablet:w-[104px] tablet:h-[104px] overflow-clip rounded-none bg-caledon cursor-pointer
                transition-opacity duration-300
                outline-2 outline-offset-[-2px] ${
                  index === active
                    ? "outline-solid outline-brown opacity-100"
                    : "outline-dotted outline-beige opacity-60 hover:opacity-100"
                }`}
            >
              <ProductImage src={src} sizes="(max-width: 1199px) 25vw, 14vw" compact />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}

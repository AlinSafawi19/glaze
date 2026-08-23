"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { H4, SubtitleMd, BodyMd, LinkContact } from "./typography";
import { FooterWordmark, WordmarkImage } from "./footer-wordmark";
import { Logomark } from "./logomark";

/** The address shoppers write to. Set NEXT_PUBLIC_STORE_EMAIL to change it. */
const STORE_EMAIL = process.env.NEXT_PUBLIC_STORE_EMAIL || "glaze.skin@outlook.com";

/** The number shoppers call — dialled form for the link, spaced form for reading. */
const STORE_PHONE = "+96179345700";
const STORE_PHONE_DISPLAY = "+961 79 345 700";

function TruchetOverlay() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [c, setC] = useState(14);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const update = (w: number) => setC(w / 400);
    update(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const r = c / 2;
  const sw = Math.max(0.3, c * 0.08);

  const arcs = [
    // A(0,0): top-mid → left-mid, CCW
    `M${r},0 A${r},${r} 0 0,0 0,${r}`,
    // B(c,0): top-mid → right-mid, CW
    `M${c+r},0 A${r},${r} 0 0,1 ${c*2},${r}`,
    // B(0,c): top-mid → right-mid, CW
    `M${r},${c} A${r},${r} 0 0,1 ${c},${c+r}`,
    // A(c,c): top-mid → left-mid, CCW
    `M${c+r},${c} A${r},${r} 0 0,0 ${c},${c+r}`,
  ].join(" ");

  return (
    <svg ref={svgRef} className="absolute inset-0 w-full h-full" aria-hidden style={{ zIndex: 2 }}>
      <defs>
        <pattern id="tp" x="0" y="0" width={c * 2} height={c * 2} patternUnits="userSpaceOnUse">
          <path d={arcs} fill="none" stroke="var(--color-accent)" strokeWidth={sw} strokeLinecap="round" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tp)" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="w-full flex flex-col justify-start items-center gap-[10px] p-0 bg-plum overflow-clip">

      {/* Footer Wrapper */}
      <div className="w-full max-w-[1920px] flex flex-col justify-start items-center gap-[24px]
        px-[16px] pt-[40px] pb-[24px]
        tablet:px-[24px] tablet:pt-[64px]
        desktop:px-[32px] desktop:pt-[80px]">

        {/* ── 1. Graphic Wrapper ── */}
        <div className="w-full flex flex-col desktop:flex-row justify-start items-start
          gap-[40px] desktop:gap-[16px]
          pb-[80px] desktop:pb-[200px]
          overflow-clip rounded-none
          border-b border-dashed border-accent">

          <H4 className="!text-accent w-full desktop:flex-1 !text-left [text-wrap:balance]">
            A curated shop for Korean skincare. Every formula is made in Korea by the brand on the bottle — we choose what we stock, we don&apos;t make it.
          </H4>

          {/* Contact details */}
          <div className="w-full desktop:flex-1 flex flex-col tablet:flex-row justify-start items-start gap-[16px] overflow-clip rounded-none">

            <div className="flex-1 flex flex-col justify-start items-start gap-[10px] overflow-clip rounded-none">
              <SubtitleMd className="w-full !text-white [text-wrap:balance]">Where to find us</SubtitleMd>
              <BodyMd className="w-full !text-white [text-wrap:balance]">Anywhere in Lebanon — we deliver to your door</BodyMd>
            </div>

            <div className="flex-1 flex flex-col justify-start items-start gap-[10px] overflow-clip rounded-none">
              <SubtitleMd className="w-full !text-white [text-wrap:balance]">Email Us</SubtitleMd>
              <LinkContact href={`mailto:${STORE_EMAIL}`}>{STORE_EMAIL}</LinkContact>
            </div>

            <div className="flex-1 flex flex-col justify-start items-start gap-[10px] overflow-clip rounded-none">
              <SubtitleMd className="w-full !text-white [text-wrap:balance]">Call us</SubtitleMd>
              <LinkContact href={`tel:${STORE_PHONE}`}>{STORE_PHONE_DISPLAY}</LinkContact>
            </div>

          </div>
        </div>

        {/* ── 2. Content Wrapper ── */}
        <div className="w-full flex flex-col tablet:flex-row justify-between items-center gap-[16px] overflow-clip rounded-none">

          {/* Logo inner wrapper */}
          <div className="w-full tablet:flex-1 flex flex-row justify-start items-center gap-[10px] overflow-clip rounded-none">
            <FooterWordmark
              src="/glaze-monochrome-blush.svg"
              width={982}
              label="GLAZE — home"
              href="/"
              className="flex-1"
            />

            {/* Copyright wrapper */}
            <div className="flex-1 min-w-0 flex flex-row justify-start items-center overflow-clip rounded-none">
              <WordmarkImage src="/copyright-2026-monochrome.svg" width={902} alt="Copyright 2026" />
            </div>
          </div>

          {/* Footer menu wrapper */}
          <div className="w-full tablet:flex-1 flex flex-row justify-start items-center gap-[10px] overflow-clip rounded-none">
            <FooterWordmark
              src="/contact-monochrome-blush.svg"
              width={1400}
              label="Contact"
              href="/contact"
              className="flex-1"
            />
            <FooterWordmark
              src="/terms-of-use-monochrome-blush.svg"
              width={2069}
              label="Terms of use"
              href="/terms-of-use"
              className="flex-1"
            />
          </div>

        </div>

        {/* ── 3. Logo wrapper ── */}
        <div className="w-full relative
          py-[40px] desktop:py-[80px] px-[32px]
          overflow-clip rounded-none">

          {/* Truchet background */}
          {/* Image base layer */}
          <div className="absolute inset-0 z-[1]">
            <Image
              src="https://framerusercontent.com/images/ZbYyoU6EfYLcinn2akWs02lFfg.png?scale-down-to=2048&width=2400&height=1800"
              alt=""
              fill
              sizes="100vw"
              quality={90}
              className="object-cover"
            />
          </div>

          {/* Truchet overlay (accent background + arc pattern) */}
          <TruchetOverlay />

          {/* Large logotype — scales to fill container */}
          <div className="relative z-[3] flex justify-center items-center">
            <Logomark className="mx-auto" />
          </div>

        </div>

      </div>
    </footer>
  );
}

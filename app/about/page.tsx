"use client";

import { H5, SubtitleMd } from "@/components/ui/typography";
import { ImgBox } from "@/components/ui/img-box";

export default function About() {
  return (
    <main>
      {/* No title on screen — the design opens on imagery — so the page's
          heading is for search engines and screen readers. */}
      <h1 className="sr-only">About GLAZE — authentic Korean skincare</h1>

      {/* ── About Info ── */}
      <section className="w-full flex flex-col justify-start items-center gap-0 p-0 overflow-clip rounded-none">

        <div className="w-full max-w-[1920px] flex flex-col justify-start items-center overflow-clip rounded-none bg-dusty
          gap-[24px] pt-[32px] px-[16px] pb-[48px]
          tablet:gap-[64px] tablet:pt-[48px] tablet:px-[24px] tablet:pb-[64px]
          desktop:gap-[64px] desktop:pt-[64px] desktop:px-[32px] desktop:pb-[80px]">

          {/* Img info wrapper */}
          <div className="w-full flex flex-col justify-start items-center gap-0 p-0 overflow-clip rounded-none">
            <ImgBox />
          </div>

          {/* Secondary title wrapper */}
          <div className="w-full max-w-[800px] flex flex-col justify-start items-center gap-[8px] p-0 overflow-clip rounded-none z-[1]">
            <H5 className="w-auto h-auto z-[1] !text-brown !text-center [text-wrap:balance]">
              We source skincare from the Korean houses that formulate it, and pass it on unchanged. Same formula, same bottle, nothing relabelled.
            </H5>
          </div>

        </div>

      </section>

      {/* ── Banner ── */}
      <section className="w-full flex flex-col justify-start items-center gap-0 p-0 overflow-clip rounded-none">

        <div className="w-full max-w-[1920px] flex flex-col justify-start items-center gap-[32px] overflow-clip rounded-none bg-dusty
          px-[16px] pb-[48px]
          tablet:px-[24px] tablet:pb-[64px]
          desktop:px-[32px] desktop:pb-[80px]">

          {/* Title wrapper */}
          <div className="w-full max-w-[800px] flex flex-col justify-start items-center gap-[8px] p-0 overflow-clip rounded-none z-[1]">
            <SubtitleMd className="w-auto h-auto z-[1] !text-brown !text-center [text-wrap:balance]">
              Every product we list is made in Korea by the brand named on it. We are a shop, not a laboratory — what we add is the selection, never the formula.
            </SubtitleMd>
          </div>

        </div>

      </section>

    </main>
  );
}

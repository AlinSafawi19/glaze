"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { fetchBySlug } from "@/lib/api";
const SPRING = { type: "spring" as const, duration: 0.6, bounce: 0, delay: 0 };

export default function TermsOfUse() {
  const [content, setContent] = useState("");

  useEffect(() => {
    const abort = new AbortController();

    // One row, looked up by name - no reason to read the list to find it.
    fetchBySlug<{ Content?: string }>("utility-pages", "terms-of-use", abort.signal)
      .then((entry) => {
        if (abort.signal.aborted || !entry) return;
        setContent(entry.Content ?? "");
      })
      .catch(() => { /* the page simply stays empty */ });

    return () => abort.abort();
  }, []);

  return (
    <main>

      {/* â”€â”€ Content â”€â”€ */}
      <motion.section
        className="w-full flex flex-col justify-start items-center gap-[10px] p-0 overflow-clip rounded-none bg-blush"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.05 }}
        transition={SPRING}
      >

        {/* Container */}
        <motion.div
          className="w-full max-w-[1920px] flex flex-col justify-start items-center overflow-clip rounded-none
            gap-[24px] pt-[32px] px-[16px] pb-[48px]
            tablet:gap-0 tablet:pt-[48px] tablet:px-[24px] tablet:pb-[64px]
            desktop:gap-0 desktop:pt-[64px] desktop:px-[32px] desktop:pb-[80px]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ ...SPRING, delay: 0.05 }}
        >

          {/* Title wrapper */}
          <div className="w-full flex flex-col tablet:flex-row justify-start items-start gap-[32px] p-0 overflow-clip rounded-none z-[1]">

            {/* Imgs wrapper */}
            <div className="relative tablet:sticky tablet:top-[96px] tablet:self-start w-full flex flex-row justify-center items-start gap-[16px] p-0 overflow-clip rounded-none z-[1]">
              <div className="relative w-full h-[400px] max-h-[400px] overflow-clip rounded-none">
                <Image
                  src="/images/about-ticker2.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 809px) 100vw, 50vw"
                  quality={90}
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* Texting wrapper */}
            <div className="w-full flex flex-col justify-start items-start gap-[32px] tablet:gap-[48px] p-0 overflow-clip rounded-none">
              <div className="w-full flex flex-col justify-start items-start gap-[20px] p-0 overflow-clip rounded-none">
                <div
                  className="policy-richtext"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>

          </div>

        </motion.div>

      </motion.section>

    </main>
  );
}

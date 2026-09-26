"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { H2, H3, ItalicBodyLg, SubtitleMd } from "@/components/ui/typography";
import { FaqCardContact } from "@/components/ui/faq-card";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    question: "What payment methods do you accept?",
    answer: "Cash on delivery only. You pay the courier in cash when the order reaches you — we do not take cards, bank transfers, or any online payment, and we will never ask you for card details.",
  },
  {
    question: "How long does shipping take?",
    answer: "Orders leave our warehouse within 1–2 business days. Restocks come direct from Korea, so a sold-out item can take longer — the product page always shows current availability.",
  },
  {
    question: "Can I return or exchange an item?",
    answer: "No. All sales are final, so please check your order carefully before confirming it. If something arrives damaged or is not what you ordered, call us the same day and we will make it right.",
  },
  {
    question: "Where do your products come from?",
    answer: "Everything we sell is Korean skincare, made in Korea by the brand named on the packaging. GLAZE is a retailer — we source from the brands and their authorised distributors, and we do not formulate, blend, or repackage anything ourselves.",
  },
  {
    question: "Is my personal data secure?",
    answer: "Absolutely. We use advanced encryption and secure systems to protect your data and ensure a safe shopping experience.",
  },
];

const SPRING = { type: "spring" as const, duration: 0.6, bounce: 0, delay: 0 };

export default function Contact() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const formEmpty = !name.trim() || !email.trim() || !message.trim();

  return (
    <main>

      {/* ── FAQ ── */}
      <motion.section
        className="w-full flex flex-col justify-start items-center gap-[10px] p-0 overflow-clip rounded-none bg-lavender"
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
          <div className="w-full max-w-[1920px] flex flex-col justify-start items-center overflow-clip rounded-none z-[2]
            gap-[24px] pt-[24px] px-0 pb-[24px]
            tablet:gap-[24px] tablet:pt-[40px] tablet:px-[24px] tablet:pb-[40px]
            desktop:pt-[56px] desktop:px-[32px] desktop:pb-[56px]">

            {/* Title top wrapper */}
            <div className="w-full flex flex-col justify-start items-center gap-[4px] p-0 overflow-clip rounded-none">
              <H2 className="w-full max-w-[800px] !text-black !text-center [text-wrap:balance]">
                WE CARE FOR OUR CLIENTS
              </H2>
            </div>

            {/* Imgs wrapper */}
            <div className="w-full flex flex-row justify-center items-start overflow-clip rounded-none p-0
              gap-[8px]
              tablet:gap-[16px]
              desktop:gap-[16px]">

              <div className="relative overflow-clip rounded-none
                w-full h-[203px]
                tablet:w-[320px] tablet:h-[372px]
                desktop:w-[320px] desktop:h-[372px]">
                <Image
                  src="/images/contact-image1.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 809px) 100vw, 320px"
                  quality={90}
                  className="object-cover object-center"
                />
              </div>

              <div className="relative overflow-clip rounded-none
                w-full h-[203px]
                tablet:w-[320px] tablet:h-[372px]
                desktop:w-[320px] desktop:h-[372px]">
                <Image
                  src="/images/contact-image2.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 809px) 100vw, 320px"
                  quality={90}
                  className="object-cover object-center"
                />
              </div>

            </div>

            {/* Title bottom wrapper */}
            <div className="w-full flex flex-col justify-start items-center gap-[4px] p-0 overflow-clip rounded-none">
              <H3 className="w-full max-w-[800px] !text-black !text-center [text-wrap:balance]">
                A refined shopping experience
              </H3>
              <ItalicBodyLg className="w-full max-w-[800px] !text-black !text-center [text-wrap:balance]">
                answers to help you shop with confidence
              </ItalicBodyLg>
            </div>

          </div>

          {/* Questions wrapper */}
          <motion.div
            className="w-full flex flex-col justify-start items-center overflow-visible rounded-none p-0
              gap-[21px]
              tablet:gap-[24px]
              desktop:gap-[24px]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ ...SPRING, delay: 0.1 }}
          >
            {FAQS.map((faq) => (
              <FaqCardContact
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                className="w-full max-w-[800px]"
              />
            ))}
          </motion.div>

        </motion.div>

      </motion.section>

      {/* ── Contact Form ── */}
      <section className="relative w-full flex flex-col justify-start items-center gap-0 p-0 overflow-clip rounded-none">

        {/* Background image */}
        <div className="absolute inset-0 z-[1]">
          <Image
            src="/images/contact-form-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            quality={90}
            className="object-cover object-center"
          />
        </div>

        {/* Frosted glass — a pane laid over the photo rather than the photo
            itself blurred: it softens whatever sits behind it, a pale tint
            lifts it toward the palette, and a fine grain keeps it matte. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            backdropFilter:       "blur(12px) saturate(1.1)",
            WebkitBackdropFilter: "blur(12px) saturate(1.1)",
            backgroundColor:      "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        {/* Outer container */}
        <div className="relative w-full max-w-[1920px] flex flex-col justify-start items-center overflow-clip rounded-none z-[2]
          gap-[56px] pt-[64px] px-[16px] pb-[64px]
          tablet:gap-[64px] tablet:pt-[80px] tablet:px-[32px] tablet:pb-[80px]
          desktop:gap-[64px] desktop:pt-[80px] desktop:px-[32px] desktop:pb-[80px]">

          {/* Inner container */}
          <div className="w-full max-w-[720px] flex flex-col justify-start items-center overflow-clip rounded-none bg-white
            gap-[64px] p-[32px]
            tablet:p-[80px]
            desktop:p-[80px]">

            {/* Title */}
            <H2 className="w-full !text-black !text-center">Say hello</H2>

            {/* Form */}
            <form className="w-full flex flex-col justify-start items-start gap-[48px] p-0 overflow-hidden rounded-none">

              {/* Inputs wrapper */}
              <div className="w-full flex flex-col justify-start items-start gap-[32px] p-0 overflow-clip rounded-none">

                {/* Name */}
                <div className="w-full flex flex-col justify-start items-center gap-[32px] p-0 overflow-visible rounded-none">
                  <SubtitleMd className="w-full !text-brown !text-left">Name</SubtitleMd>
                  <input
                    type="text"
                    name="Name"
                    placeholder="Jane Smith"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-[48px] bg-transparent outline-none border-0 border-b border-beige px-0 pt-0 pb-[8px] font-inter font-normal text-[20px] leading-[1.2] tracking-[0em] text-black placeholder:text-beige"
                    style={{ transition: "border-color 0.3s cubic-bezier(0.44,0,0.56,1)" }}
                    onFocus={e => (e.currentTarget.style.borderBottomColor = "var(--color-brown)")}
                    onBlur={e  => (e.currentTarget.style.borderBottomColor = "var(--color-beige)")}
                  />
                </div>

                {/* Email */}
                <div className="w-full flex flex-col justify-start items-center gap-[32px] p-0 overflow-visible rounded-none">
                  <SubtitleMd className="w-full !text-brown !text-left">Email</SubtitleMd>
                  <input
                    type="email"
                    name="Email"
                    placeholder="jane@example.com"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-[48px] bg-transparent outline-none border-0 border-b border-beige px-0 pt-0 pb-[8px] font-inter font-normal text-[20px] leading-[1.2] tracking-[0em] text-black placeholder:text-beige"
                    style={{ transition: "border-color 0.3s cubic-bezier(0.44,0,0.56,1)" }}
                    onFocus={e => (e.currentTarget.style.borderBottomColor = "var(--color-brown)")}
                    onBlur={e  => (e.currentTarget.style.borderBottomColor = "var(--color-beige)")}
                  />
                </div>

                {/* Message */}
                <div className="w-full flex flex-col justify-start items-center gap-[32px] p-0 overflow-visible rounded-none">
                  <SubtitleMd className="w-full !text-brown !text-left">Message</SubtitleMd>
                  <textarea
                    name="Message"
                    placeholder="Write here"
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full min-h-[100px] bg-transparent outline-none border-0 border-b border-beige px-0 pt-0 pb-[8px] font-inter font-normal text-[20px] leading-[1.2] tracking-[0em] text-black placeholder:text-beige"
                    style={{ resize: "vertical", transition: "border-color 0.3s cubic-bezier(0.44,0,0.56,1)" }}
                    onFocus={e => (e.currentTarget.style.borderBottomColor = "var(--color-brown)")}
                    onBlur={e  => (e.currentTarget.style.borderBottomColor = "var(--color-beige)")}
                  />
                </div>

              </div>

              {/* Submit */}
              <div className="w-full flex justify-center">
                <Button type="submit" disabled={formEmpty} />
              </div>

            </form>

          </div>

        </div>

      </section>

    </main>
  );
}

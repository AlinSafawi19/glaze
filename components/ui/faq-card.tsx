"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { SubtitleSm, SubtitleMd, BodySm } from "./typography";

const SPRING = { type: "spring" as const, duration: 0.4, bounce: 0, delay: 0 };

const MotionSubtitleSm = motion(SubtitleSm);
const MotionSubtitleMd = motion(SubtitleMd);

interface FaqCardProps {
  question?: string;
  answer?: string;
  className?: string;
}

function FaqCardBase({
  question = "Delivery",
  answer = "Order before 2PM for Next Day Delivery.",
  withHover = false,
  className = "",
}: FaqCardProps & { withHover?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hovered, setHovered] = useState(false);

  const active = withHover && isDesktop && hovered;
  const textColor = active ? "var(--color-brown)" : "var(--color-black)";

  useEffect(() => {
    if (!withHover) return;
    const check = () => setIsDesktop(window.innerWidth >= 1200);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [withHover]);

  return (
    <div
      className={`flex flex-col justify-start items-start gap-[8px] p-0 overflow-clip rounded-none max-w-[800px] cursor-pointer ${className}`}
      onMouseEnter={withHover ? () => setHovered(true) : undefined}
      onMouseLeave={withHover ? () => setHovered(false) : undefined}
      onClick={() => setIsOpen((v) => !v)}
    >
      {/* Question Wrapper */}
      <button
        type="button"
        className="w-full flex flex-row justify-start items-center gap-[1px] p-0 overflow-clip rounded-none bg-transparent border-none text-left"
      >
        {/* Question Text */}
        {withHover ? (
          <MotionSubtitleMd
            className="flex-1 !text-left"
            animate={{ color: textColor }}
            transition={SPRING}
          >
            {question}
          </MotionSubtitleMd>
        ) : (
          <MotionSubtitleSm
            className="flex-1 !text-left"
            animate={{ color: textColor }}
            transition={SPRING}
          >
            {question}
          </MotionSubtitleSm>
        )}

        {/* Icon Wrapper */}
        <motion.div
          className="relative w-5 h-5 flex-shrink-0"
          animate={{ color: textColor }}
          transition={SPRING}
        >
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: isOpen ? 0 : 1 }}
            transition={SPRING}
          >
            <Plus size={20} strokeWidth={1.5} />
          </motion.span>
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={SPRING}
          >
            <Minus size={20} strokeWidth={1.5} />
          </motion.span>
        </motion.div>
      </button>

      {/* Answer Wrapper */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING}
            style={{ overflow: "hidden" }}
          >
            <div className="w-[476px] flex flex-col justify-start items-start gap-0 p-0 pr-[32px] overflow-clip rounded-none">
              {/* Answers are shop-written now, and a routine typed as steps
                  is only readable if the breaks survive. */}
              <BodySm className="w-full max-w-[600px] whitespace-pre-line !text-black">
                {answer}
              </BodySm>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqCardProduct(props: FaqCardProps) {
  return <FaqCardBase {...props} withHover={false} />;
}

export function FaqCardContact(props: FaqCardProps) {
  return <FaqCardBase {...props} withHover={true} />;
}

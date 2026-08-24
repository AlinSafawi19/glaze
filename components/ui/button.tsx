"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CircleArrowRight } from "lucide-react";
import { ButtonSm, H5Span, H6Span } from "./typography";

function GradientLoader({ size = 20 }: { size?: number }) {
  return (
    <div
      className="animate-spin"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "conic-gradient(rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)",
        WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px))`,
        mask: `radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px))`,
      }}
    />
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg role="presentation" viewBox="0 0 24 24" width={size} height={size} style={{ opacity: 1 }}>
      <use href="#465907804" />
    </svg>
  );
}
import { ButtonHTMLAttributes, useState, useEffect, type ReactNode } from "react";

const EASE = [0.44, 0, 0.56, 1] as const;
const SPRING = { type: "spring" as const, duration: 0.4, bounce: 0.2 };

interface OutlineButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Omit for the default plus glyph, pass an element to replace it, or pass
   * `null` for no icon at all.
   *
   * The distinction matters: `icon ?? <PlusIcon/>` would treat "no icon" and
   * "not specified" alike, and an empty fragment cannot stand in for null
   * either — React serialises `<></>` to null when a Server Component passes it
   * to a Client Component, which silently restored the plus on exactly the
   * pages that render on the server.
   */
  icon?: ReactNode;
}

/** `undefined` means "unspecified"; any other value, including null, is a choice. */
function iconOrDefault(icon: ReactNode): ReactNode {
  return icon === undefined ? <PlusIcon size={16} /> : icon;
}

export function OutlineButton({
  children,
  icon,
  className = "",
  ...props
}: OutlineButtonProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [hovered,   setHovered]   = useState(false);
  const active = isDesktop && hovered;

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1200);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex flex-row items-center justify-center gap-[10px] px-[12px] py-[6px] rounded-none overflow-clip cursor-pointer bg-transparent ${className}`}
      {...props}
    >
      {/* `initial` is not optional here: without it Motion writes no opacity at
          all on the first render, so the fill paints solid black over the
          button and only springs away once hydration catches up. */}
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={SPRING}
      />
      <ButtonSm
        className="relative z-10 text-left"
        style={{
          color: active ? "var(--color-accent)" : "var(--color-black)",
          transition: `color 0.4s cubic-bezier(0.44, 0, 0.56, 1)`,
        }}
      >
        {children}
      </ButtonSm>
      <span
        aria-hidden
        className="relative z-10"
        style={{
          color: active ? "var(--color-accent)" : "var(--color-black)",
          transition: `color 0.4s cubic-bezier(0.44, 0, 0.56, 1)`,
        }}
      >
        {iconOrDefault(icon)}
      </span>
    </button>
  );
}

interface FilledButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

export function FilledButton({
  children,
  icon,
  className = "",
  ...props
}: FilledButtonProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [hovered,   setHovered]   = useState(false);
  const active = isDesktop && hovered;

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1200);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex flex-row items-center justify-center gap-[10px] px-[24px] py-[12px] rounded-none overflow-clip cursor-pointer bg-black ${className}`}
      {...props}
    >
      <ButtonSm
        className="relative z-10 text-left"
        style={{
          color: active ? "var(--color-beige)" : "var(--color-accent)",
          transition: `color 0.4s cubic-bezier(0.44, 0, 0.56, 1)`,
        }}
      >
        {children}
      </ButtonSm>
      <span
        aria-hidden
        className="relative z-10"
        style={{
          color: active ? "var(--color-beige)" : "var(--color-accent)",
          transition: `color 0.4s cubic-bezier(0.44, 0, 0.56, 1)`,
        }}
      >
        {iconOrDefault(icon)}
      </span>
    </button>
  );
}

export type ButtonState = "default" | "loading" | "success" | "error";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  buttonState?: ButtonState;
  /** Labels default to the contact form's wording. */
  label?:        string;
  successLabel?: string;
  errorLabel?:   string;
}

export function Button({
  buttonState = "default",
  label        = "Send",
  successLabel = "Thank you",
  errorLabel   = "Something wrong",
  className = "",
  disabled,
  ...props
}: SubmitButtonProps) {
  const isDisabled = buttonState === "loading" || (buttonState === "default" && !!disabled);

  return (
    <button
      disabled={isDisabled}
      className={`relative flex items-center justify-center w-[320px] h-[40px] gap-[8px] rounded-[10px] overflow-visible bg-transparent border-none p-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ transition: `all 0.2s cubic-bezier(0.44, 0, 0.56, 1)` }}
      {...props}
    >
      {/* `initial={false}` so the resting label is painted straight away rather
          than fading up from `opacity: 0` once the bundle hydrates — the label
          is in the server HTML, and a form whose submit arrives late reads as
          the page still loading. State changes after mount still animate. */}
      <AnimatePresence mode="wait" initial={false}>
        {buttonState === "loading" && (
          <motion.span
            key="loading"
            className="flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <GradientLoader size={20} />
          </motion.span>
        )}

        {buttonState === "success" && (
          <motion.span
            key="success"
            className="flex items-center justify-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <H6Span className="text-center !text-black">
              {successLabel}
            </H6Span>
          </motion.span>
        )}

        {buttonState === "error" && (
          <motion.span
            key="error"
            className="flex items-center justify-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <H6Span className="text-center !text-error">
              {errorLabel}
            </H6Span>
          </motion.span>
        )}

        {buttonState === "default" && (
          <motion.span
            key="default"
            className="flex items-center justify-center gap-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <H5Span className="text-center [text-wrap:balance] !text-brown">
              {label}
            </H5Span>
            <CircleArrowRight
              size={24}
              strokeWidth={1.5}
              className="text-brown"
              aria-hidden
            />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

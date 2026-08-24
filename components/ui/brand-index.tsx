"use client";

import { useMemo, useState } from "react";
import { Eraser } from "lucide-react";
import { H4, ItalicBodySm } from "./typography";
import type { FilterItem } from "./filters";
import { usePagedList, PagedListControls } from "./paged-list";

/** Brand chips shown per letter before "Show more". */
const CHIP_PAGE_SIZE = 24;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ALL      = "ALL";
const OTHER    = "#";

/** Brands that do not start with a letter are grouped under `#`. */
function initialOf(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return ALPHABET.includes(first) ? first : OTHER;
}

const EASE = "cubic-bezier(0.44, 0, 0.56, 1)";

function LetterButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label:     string;
  active:    boolean;
  disabled:  boolean;
  onClick:   () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`font-clash font-medium clash-features uppercase text-[13px] leading-[1.4] rounded-none border-none bg-transparent p-0
        min-w-[20px] text-center
        ${disabled ? "text-beige cursor-default" : "cursor-pointer"}
        ${active ? "text-black underline underline-offset-[6px]" : disabled ? "" : "text-brown hover:text-black"}`}
      style={{ transition: `color 0.3s ${EASE}` }}
    >
      {label}
    </button>
  );
}

export interface BrandIndexProps {
  brands:    FilterItem[];
  selected:  Set<string>;
  onToggle:  (id: string) => void;
  onClear:   () => void;
  className?: string;
}

/**
 * Brands browse strip — an A–Z index rather than a checkbox list, so the full
 * roster stays scannable above the shop. Selections drive the same
 * `selectedBrands` state the sidebar filters use.
 */
export function BrandIndex({
  brands,
  selected,
  onToggle,
  onClear,
  className = "",
}: BrandIndexProps) {
  const [letter, setLetter] = useState(ALL);

  // Which initials actually have brands behind them.
  const available = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => set.add(initialOf(b.name)));
    return set;
  }, [brands]);

  const visible = useMemo(() => {
    const list = letter === ALL ? brands : brands.filter((b) => initialOf(b.name) === letter);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [brands, letter]);

  // Resets to the first chunk whenever `visible` changes — that is, on every
  // letter the shopper picks.
  const paged = usePagedList(visible, CHIP_PAGE_SIZE);

  if (brands.length === 0) return null;

  return (
    <div className={`w-full flex flex-col justify-start items-start gap-[16px] p-0 rounded-none ${className}`}>

      {/* Title + clear */}
      <div className="w-full flex flex-row justify-between items-center gap-[16px]">
        <H4 className="w-auto h-auto !text-beige !text-left">Brands</H4>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 flex flex-row items-center gap-[6px] font-clash font-medium clash-features uppercase text-brown text-[13px] leading-[1.4] border-none bg-transparent p-0 cursor-pointer"
          >
            <Eraser size={14} strokeWidth={1.5} />
            Clear {selected.size}
          </button>
        )}
      </div>

      {/* A–Z index */}
      <div className="w-full flex flex-row flex-wrap justify-start items-center gap-x-[12px] gap-y-[8px] pb-[16px] border-b border-dashed border-beige">
        <LetterButton
          label={ALL}
          active={letter === ALL}
          disabled={false}
          onClick={() => setLetter(ALL)}
        />
        {ALPHABET.map((l) => (
          <LetterButton
            key={l}
            label={l}
            active={letter === l}
            disabled={!available.has(l)}
            onClick={() => setLetter(l)}
          />
        ))}
        {available.has(OTHER) && (
          <LetterButton
            label={OTHER}
            active={letter === OTHER}
            disabled={false}
            onClick={() => setLetter(OTHER)}
          />
        )}
      </div>

      {/* Brands under the active letter */}
      {visible.length === 0 ? (
        <ItalicBodySm className="!text-brown !text-left">
          No brands under {letter}
        </ItalicBodySm>
      ) : (
        <div className="w-full flex flex-col justify-start items-start gap-[12px]">
        <div className="w-full flex flex-row flex-wrap justify-start items-center gap-[8px]">
          {paged.visible.map((brand) => {
            const on = selected.has(brand.id);
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => onToggle(brand.id)}
                aria-pressed={on}
                className={`font-clash font-medium clash-features text-[13px] leading-[1.4] rounded-none border border-dashed px-[16px] py-[8px] cursor-pointer
                  ${on ? "bg-black border-black text-accent" : "bg-transparent border-beige text-brown hover:bg-blush hover:text-plum"}`}
                style={{ transition: `background-color 0.3s ${EASE}, color 0.3s ${EASE}, border-color 0.3s ${EASE}` }}
              >
                {brand.name}
              </button>
            );
          })}
        </div>
        <PagedListControls
          remaining={paged.remaining}
          expanded={paged.expanded}
          onMore={paged.showMore}
          onLess={paged.showLess}
          className="!pt-0"
        />
        </div>
      )}

    </div>
  );
}

"use client";

import { Eraser } from "lucide-react";
import { H4, ItalicBodySm } from "./typography";
import { PagedListControls } from "./paged-list";
import { ALL_LETTERS, NON_ALPHA, type BrandIndexData } from "./use-shop-data";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
  /** The server-paged brand list, letter and all. */
  data:      BrandIndexData;
  /** Slugs of the brands currently filtering the shop. */
  selected:  Set<string>;
  onToggle:  (slug: string) => void;
  onClear:   () => void;
  className?: string;
}

/**
 * Brands browse strip — an A–Z index rather than a checkbox list, so the full
 * roster stays scannable above the shop.
 *
 * The letter is a query, not a client-side filter: picking one asks the server
 * for that letter's brands. Which letters are worth offering comes back as a
 * facet, so the index stays accurate without the page ever holding the whole
 * list. Selections drive the same brand filter the product query uses.
 */
export function BrandIndex({
  data,
  selected,
  onToggle,
  onClear,
  className = "",
}: BrandIndexProps) {
  const { items, total, letter, setLetter, initials, hasMore, loadingMore, loadMore } = data;

  // Nothing to browse: no strip. Keyed on the facet rather than the page, so it
  // does not disappear on a letter that happens to be empty.
  if (initials.size === 0 && items.length === 0) return null;

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
          label={ALL_LETTERS}
          active={letter === ALL_LETTERS}
          disabled={false}
          onClick={() => setLetter(ALL_LETTERS)}
        />
        {ALPHABET.map((l) => (
          <LetterButton
            key={l}
            label={l}
            active={letter === l}
            disabled={!initials.has(l)}
            onClick={() => setLetter(l)}
          />
        ))}
        {initials.has(NON_ALPHA) && (
          <LetterButton
            label={NON_ALPHA}
            active={letter === NON_ALPHA}
            disabled={false}
            onClick={() => setLetter(NON_ALPHA)}
          />
        )}
      </div>

      {/* Brands under the active letter */}
      {items.length === 0 ? (
        <ItalicBodySm className="!text-brown !text-left">
          No brands under {letter}
        </ItalicBodySm>
      ) : (
        <div className="w-full flex flex-col justify-start items-start gap-[12px]">
          <div className="w-full flex flex-row flex-wrap justify-start items-center gap-[8px]">
            {items.map((brand) => {
              const on = selected.has(brand.slug);
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => onToggle(brand.slug)}
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
          {hasMore && (
            <PagedListControls
              remaining={total - items.length}
              busy={loadingMore}
              onMore={loadMore}
              className="!pt-0"
            />
          )}
        </div>
      )}

    </div>
  );
}

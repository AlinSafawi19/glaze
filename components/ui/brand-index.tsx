"use client";

import { Eraser, X } from "lucide-react";
import { H4, ItalicBodySm } from "./typography";
import { PagedListControls } from "./paged-list";
import { ALL_LETTERS, NON_ALPHA, type BrandIndexData } from "./use-shop-data";
import type { FilterItem } from "./filters";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const EASE = "cubic-bezier(0.44, 0, 0.56, 1)";

/** Shared by the letter's chips and the pinned ones, so a brand looks the same in both. */
const CHIP =
  "font-clash font-medium clash-features text-[13px] leading-[1.4] rounded-none " +
  "border border-dashed px-[16px] py-[8px] cursor-pointer";

const CHIP_ON  = "bg-black border-black text-accent";
const CHIP_OFF = "bg-transparent border-beige text-brown hover:bg-blush hover:text-plum";

/**
 * A readable stand-in for a brand whose name has not arrived yet.
 *
 * Brand names are set as their owners write them, so this is a guess and never
 * the final label — it is on screen only for the moment between a link landing
 * and its lookup returning, which matters because the alternative is a chip
 * that says nothing at all.
 */
function humanize(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

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

/** The strip's own frame, drawn at its real height while the first page loads. */
function IndexSkeleton() {
  return (
    <div className="w-full flex flex-col justify-start items-start gap-[16px]" aria-hidden="true">
      <div className="w-full flex flex-row flex-wrap justify-start items-center gap-x-[12px] gap-y-[8px] pb-[16px] border-b border-dashed border-beige">
        {/* "ALL" plus the alphabet, so the row settles at the height it will keep. */}
        {["ALL", ...ALPHABET].map((label) => (
          <span
            key={label}
            className="font-clash font-medium clash-features uppercase text-[13px] leading-[1.4] min-w-[20px] text-center text-beige"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="w-full flex flex-row flex-wrap justify-start items-center gap-[8px]">
        {[72, 96, 60, 88, 76, 104].map((width, i) => (
          <span
            key={i}
            className="h-[33px] rounded-none border border-dashed border-beige bg-transparent"
            style={{ width }}
          />
        ))}
      </div>
    </div>
  );
}

export interface BrandIndexProps {
  /** The server-paged brand list, letter and all. */
  data:      BrandIndexData;
  /** Slugs of the brands currently filtering the shop. */
  selected:  Set<string>;
  /** Those same brands, named — see `useBrandsBySlug`. */
  selectedItems: FilterItem[];
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
 *
 * The two rows do different jobs and are labelled as such: the letters browse,
 * the chips filter. Every brand the shopper has picked is pinned above both, in
 * full, whatever letter is on screen — a selection that is filtering the grid
 * must never be something they have to go hunting for to undo.
 */
export function BrandIndex({
  data,
  selected,
  selectedItems,
  onToggle,
  onClear,
  className = "",
}: BrandIndexProps) {
  const { items, total, letter, setLetter, initials, loading, refreshing, hasMore, loadingMore, loadMore } = data;

  // Nothing to browse: no strip. Held back until the first page has actually
  // been answered, so the strip is never absent for a beat and then dropped in
  // above a grid the shopper has already started reading.
  if (!loading && initials.size === 0 && items.length === 0 && selected.size === 0) return null;

  const named = new Map(selectedItems.map((item) => [item.slug, item.name]));

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

      {/* Picked brands, pinned — the whole selection, not the part that happens
          to fall under the letter being browsed. */}
      {selected.size > 0 && (
        <div
          role="group"
          aria-label="Selected brands"
          className="w-full flex flex-row flex-wrap justify-start items-center gap-[8px]"
        >
          {[...selected].map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => onToggle(slug)}
              aria-pressed={true}
              aria-label={`Remove ${named.get(slug) ?? humanize(slug)}`}
              className={`${CHIP} ${CHIP_ON} inline-flex flex-row items-center gap-[8px]`}
              style={{ transition: `background-color 0.3s ${EASE}, color 0.3s ${EASE}, border-color 0.3s ${EASE}` }}
            >
              {named.get(slug) ?? humanize(slug)}
              <X size={12} strokeWidth={2} />
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <IndexSkeleton />
      ) : (
        <>
          {/* A–Z index */}
          <div
            role="group"
            aria-label="Browse brands by letter"
            className="w-full flex flex-row flex-wrap justify-start items-center gap-x-[12px] gap-y-[8px] pb-[16px] border-b border-dashed border-beige"
          >
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
              {letter === ALL_LETTERS ? "No brands yet" : `No brands under ${letter}`}
            </ItalicBodySm>
          ) : (
            <div
              role="group"
              aria-label="Filter by brand"
              aria-busy={refreshing}
              className="w-full flex flex-col justify-start items-start gap-[12px]"
              // Dimmed while the next letter is on its way: what is on screen
              // belongs to the letter that was showing a moment ago.
              style={{ opacity: refreshing ? 0.45 : 1, transition: `opacity 0.3s ${EASE}` }}
            >
              <div className="w-full flex flex-row flex-wrap justify-start items-center gap-[8px]">
                {items.map((brand) => {
                  const on = selected.has(brand.slug);
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => onToggle(brand.slug)}
                      aria-pressed={on}
                      className={`${CHIP} ${on ? CHIP_ON : CHIP_OFF}`}
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
        </>
      )}

    </div>
  );
}

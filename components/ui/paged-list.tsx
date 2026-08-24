"use client";

import { useState } from "react";

/**
 * Reveal a long list a chunk at a time.
 *
 * The dashboard's lists are free to grow — a shop can end up with a hundred
 * brands or thirty collections — and a filter panel that renders all of them at
 * once turns into a wall the shopper has to scroll past to reach anything else.
 * Everything is already in memory, so this is purely how much is on screen.
 */
export function usePagedList<T>(items: T[], step: number) {
  const [shown, setShown] = useState(step);

  // Collapse back to the first chunk when the list underneath changes — a new
  // letter in the brand index, or filters that finished loading. Adjusting
  // during render rather than in an effect, so the reader never sees one frame
  // of the old list's length.
  const [seen, setSeen] = useState(items);
  if (seen !== items) {
    setSeen(items);
    setShown(step);
  }

  return {
    visible:   items.slice(0, shown),
    remaining: Math.max(0, items.length - shown),
    expanded:  shown > step,
    showMore:  () => setShown((n) => n + step),
    showLess:  () => setShown(step),
  };
}

const TEXT_BUTTON =
  "font-clash font-medium clash-features uppercase text-[13px] leading-[1.4] " +
  "border-none bg-transparent p-0 cursor-pointer text-brown hover:text-black";

/**
 * The control under a paged list. Renders nothing when the whole list already
 * fits, so a short list carries no chrome at all.
 */
export function PagedListControls({
  remaining,
  expanded,
  onMore,
  onLess,
  className = "",
}: {
  remaining: number;
  expanded:  boolean;
  onMore:    () => void;
  onLess:    () => void;
  className?: string;
}) {
  if (remaining === 0 && !expanded) return null;

  return (
    <div className={`flex flex-row items-center gap-[16px] pt-[4px] ${className}`}>
      {remaining > 0 && (
        <button
          type="button"
          onClick={onMore}
          className={TEXT_BUTTON}
          style={{ transition: "color 0.3s cubic-bezier(0.44,0,0.56,1)" }}
        >
          Show {remaining} more
        </button>
      )}
      {expanded && (
        <button
          type="button"
          onClick={onLess}
          className={TEXT_BUTTON}
          style={{ transition: "color 0.3s cubic-bezier(0.44,0,0.56,1)" }}
        >
          Show less
        </button>
      )}
    </div>
  );
}

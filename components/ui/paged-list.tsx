"use client";

const TEXT_BUTTON =
  "font-clash font-medium clash-features uppercase text-[13px] leading-[1.4] " +
  "border-none bg-transparent p-0 cursor-pointer text-brown hover:text-black " +
  "disabled:cursor-default disabled:text-beige";

/**
 * The control under a list the server pages.
 *
 * Renders nothing when there is nothing more to fetch, so a list that fits in
 * one page carries no chrome at all. `remaining` is the server's total minus
 * what has arrived, so it says how many are actually left rather than how many
 * the next request happens to return.
 */
export function PagedListControls({
  remaining,
  busy = false,
  onMore,
  className = "",
}: {
  remaining: number;
  /** The next page is in flight. */
  busy?:     boolean;
  onMore:    () => void;
  className?: string;
}) {
  if (remaining <= 0) return null;

  return (
    <div className={`flex flex-row items-center gap-[16px] pt-[4px] ${className}`}>
      <button
        type="button"
        onClick={onMore}
        disabled={busy}
        aria-busy={busy}
        className={TEXT_BUTTON}
        style={{ transition: "color 0.3s cubic-bezier(0.44,0,0.56,1)" }}
      >
        {busy ? "Loading…" : `Show ${remaining} more`}
      </button>
    </div>
  );
}

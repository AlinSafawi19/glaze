"use client";

import { GlazeLoader } from "./glaze-loader";

/**
 * In-page waiting state for a route whose data is still in flight.
 *
 * {@link PageLoader} only covers the very first document load, so a client-side
 * navigation lands on the new page immediately — and a page that renders
 * nothing until its fetch returns would land as a collapsed strip. This holds
 * the height and draws the wordmark small and quiet, so it reads as a section
 * filling in rather than the site opening all over again.
 */
export function SectionLoading({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full min-h-[50vh] grid place-items-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <GlazeLoader className="!w-[min(56vw,320px)] opacity-50" />
    </div>
  );
}

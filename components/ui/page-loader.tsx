"use client";

import { useEffect, useRef, useState } from "react";
import { GlazeLoader } from "./glaze-loader";
import { usePendingLoads, whenImagesSettled } from "./loading-gate";

/**
 * The first open gets the full, unhurried draw. `min` keeps a page that came
 * back warm from flashing the overlay for two frames; `cap` is the safety net
 * for a load or a fetch that never reports back.
 */
const INTRO = { cycle: "2.6s", min: 1600, cap: 8000 };

/** How long the reveal will wait on above-the-fold imagery before giving up. */
const IMAGES = 3000;

/** Matches the fade-out duration on the overlay below. */
const FADE = 420;

/**
 * Full-screen GLAZE loader, shown once per document load and never again:
 * opening the site, a refresh, or arriving from outside. Client-side route
 * changes are deliberately not covered — an overlay on every link turns a
 * navigation that is already instant into a wait, so pages fill themselves in
 * as their data lands instead.
 *
 * The overlay comes down only once three things are true: the window has
 * loaded, nothing registered with {@link useLoadingGate} is still in flight,
 * and the imagery on screen has finished. So the first page is never revealed
 * half built — if a fetch is slow, the loader keeps drawing until it lands.
 */
export function PageLoader() {
  const pending = usePendingLoads();

  // Starts visible so the server-rendered HTML already carries the overlay —
  // the page underneath is never glimpsed before hydration.
  const [open,    setOpen]    = useState(true);
  const [arrived, setArrived] = useState(false); // window `load` fired
  const [expired, setExpired] = useState(false); // safety cap reached
  const [leaving, setLeaving] = useState(false);

  const shownAt = useRef(0);

  // Wait for the window `load` event so fonts and hero imagery are in place
  // behind the overlay.
  useEffect(() => {
    shownAt.current = Date.now();

    const finish = () => setArrived(true);
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    return () => window.removeEventListener("load", finish);
  }, []);

  // Nothing may hold the overlay hostage: a dead API or an image that never
  // arrives still ends with the page on screen.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setExpired(true), INTRO.cap);
    return () => clearTimeout(timer);
  }, [open]);

  // The reveal. Re-runs whenever any input changes, so work that starts *after*
  // the overlay was ready to lift — a second fetch, say — cancels the fade and
  // keeps the loader up until that finishes too.
  useEffect(() => {
    if (!open) return;
    if (!expired && !(arrived && pending === 0)) return;

    const abort  = new AbortController();
    const timers: number[] = [];

    (async () => {
      if (!expired) await whenImagesSettled(abort.signal, IMAGES);
      if (abort.signal.aborted) return;

      const wait = Math.max(0, INTRO.min - (Date.now() - shownAt.current));
      timers.push(
        window.setTimeout(() => {
          setLeaving(true);
          timers.push(
            window.setTimeout(() => {
              setOpen(false);
              setLeaving(false);
            }, FADE),
          );
        }, wait),
      );
    })();

    return () => {
      abort.abort();
      timers.forEach(clearTimeout);
    };
  }, [open, arrived, pending, expired]);

  // Freeze the page behind the overlay. Deliberately not `use-scroll-lock`:
  // that one restores the previous offset on release, which would undo the
  // scroll position the page opens at.
  useEffect(() => {
    if (!open) return;
    const { style } = document.documentElement;
    const previous = style.overflow;
    style.overflow = "hidden";
    return () => { style.overflow = previous; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`glz-overlay fixed inset-0 z-[500] grid place-items-center bg-blush transition-opacity duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {/* Nothing can dismiss the overlay without JS, so it must not render. */}
      <noscript>
        <style>{".glz-overlay{display:none}"}</style>
      </noscript>
      <GlazeLoader cycle={INTRO.cycle} />
    </div>
  );
}

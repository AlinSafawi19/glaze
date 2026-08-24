"use client";

import { useEffect, useState } from "react";
import { H4 } from "./typography";
import { Ticker } from "./ticker";
import { fetchAll, endpoint } from "@/lib/api";
import { useLoadingGate } from "./loading-gate";

const TICKER_URL = endpoint("ticker");

interface RawTickerItem {
  id:    string;
  Title: string;
}

interface TickerLine {
  id:   string;
  text: string;
}

function useTickerLines() {
  const [lines,   setLines]   = useState<TickerLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abort = new AbortController();

    fetchAll<RawTickerItem>(TICKER_URL, { signal: abort.signal })
      .then((entries) => {
        if (abort.signal.aborted) return;
        setLines(
          entries
            .map((e) => ({ id: e.id, text: (e.Title ?? "").trim() }))
            // A blank line would scroll past as a gap nobody asked for.
            .filter((line) => line.text !== "")
        );
      })
      .catch(() => setLines([]))
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });

    return () => abort.abort();
  }, []);

  // Part of the home page proper, so it holds the page loader up.
  useLoadingGate(loading);

  return { lines, loading };
}

/**
 * The banner under the hero. Its lines are edited in the dashboard under
 * "Ticker" — the storefront has no opinion on what they say, and renders
 * nothing at all when the list is empty rather than leaving an empty band of
 * colour across the page.
 */
export function TickerBar() {
  const { lines, loading } = useTickerLines();

  if (loading || lines.length === 0) return null;

  return (
    <section className="w-full flex flex-col justify-end items-center gap-[10px] p-0 overflow-clip rounded-none">

      <div className="w-full flex flex-col justify-end items-center gap-[23px] overflow-clip rounded-none bg-accent py-[24px] px-0 tablet:py-[32px]">

        <Ticker
          items={lines.map((line) => (
            <H4 key={line.id} className="w-auto !text-black !text-center [text-wrap:balance]">
              {line.text}
            </H4>
          ))}
          gap={24}
          speed={50}
          hoverSpeed={100}
          className="w-full z-[2] rounded-[10px] overflow-clip"
        />

      </div>

    </section>
  );
}

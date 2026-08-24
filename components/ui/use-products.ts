"use client";

import { useEffect, useState } from "react";

import { fetchBySlugs } from "@/lib/api";
import { parseStock } from "@/lib/stock";

interface RawEntry {
  id:            string;
  Slug:          string;
  Title:         string;
  "Cover img 1": string;
  Price:         string;
  Discount:      string;
  /** Absent for a product the shop does not count — see `lib/stock`. */
  Stock?:        string;
}

export interface CatalogProduct {
  id:         string;
  slug:       string;
  title:      string;
  price:      number;
  discount:   number;
  finalPrice: number;
  imageSrc:   string;
  /** Units left, or null when the shop does not track this product. */
  stock:      number | null;
}

/**
 * The products behind a set of saved slugs - a cart, a checkout, a wishlist.
 *
 * Asks for exactly those rows rather than reading the catalogue and searching
 * it: a basket of three is three rows over the wire however large the shop
 * grows, and a slug is never missed for having fallen past a page boundary.
 */
export function useProducts(slugs: string[]) {
  // The slugs come from a list that is rebuilt on every render, so the request
  // keys off their values rather than the array's identity.
  const key = slugs.join(",");

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  // An empty basket has nothing to wait for, so it is settled from the start.
  const [loading,  setLoading]  = useState(() => key !== "");

  // Reacting in render rather than in the effect: an emptied basket is resolved
  // without a request at all, and a changed one reads as loading immediately.
  const [sent, setSent] = useState(key);
  if (sent !== key) {
    setSent(key);
    setLoading(key !== "");
    if (key === "") setProducts([]);
  }

  useEffect(() => {
    if (key === "") return;

    const abort = new AbortController();

    fetchBySlugs<RawEntry & { Slug: string }>("products", key.split(","), abort.signal)
      .then((entries) => {
        if (abort.signal.aborted) return;
        setProducts(
          entries.map((e) => {
            const price    = parseFloat(e.Price)    || 0;
            const discount = parseFloat(e.Discount) || 0;
            return {
              id:         e.id,
              slug:       e.Slug,
              title:      e.Title,
              price,
              discount,
              // Discount is a percentage off, matching the product page.
              finalPrice: discount > 0 ? Math.round(price * (1 - discount / 100)) : price,
              imageSrc:   e["Cover img 1"],
              stock:      parseStock(e.Stock),
            };
          })
        );
      })
      .catch(() => setProducts([]))
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });

    return () => abort.abort();
  }, [key]);

  return { products, loading };
}
